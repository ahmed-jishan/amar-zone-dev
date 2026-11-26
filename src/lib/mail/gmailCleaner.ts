import { gdriveAuth } from '@/lib/sync/gdrive-auth'

export type GmailPreset = {
  id: string
  title: string
  description: string
  query: string
}

export const GMAIL_PRESETS: GmailPreset[] = [
  { id: 'promotions-6m', title: 'Old promotions', description: 'Promotions older than 6 months', query: 'category:promotions older_than:6m' },
  { id: 'social-3m', title: 'Old social mail', description: 'Social mail older than 3 months', query: 'category:social older_than:3m' },
  { id: 'unread-1y', title: 'Old unread mail', description: 'Unread mail older than 1 year', query: 'is:unread older_than:1y' },
  { id: 'large-10m', title: 'Large messages', description: 'Messages larger than 10 MB', query: 'larger:10m' },
  { id: 'spam', title: 'Spam', description: 'Messages in Spam', query: 'in:spam' },
]

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const PROTECTED_KEY = 'selfsync-gmail-protected-senders'

async function gmailFetch(path: string, init: RequestInit = {}) {
  const token = await gdriveAuth.getValidToken()
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Gmail request failed (${response.status})`)
  }
  return response.status === 204 ? null : response.json()
}

export async function previewGmail(query: string, limit = 20) {
  const data = await gmailFetch(`/messages?q=${encodeURIComponent(query)}&maxResults=${limit}&fields=messages(id,threadId),resultSizeEstimate`)
  const messages = data?.messages || []
  return {
    estimate: Number(data?.resultSizeEstimate || messages.length),
    ids: messages.map((message: { id: string }) => message.id),
  }
}

export async function trashGmailMatches(query: string, onProgress?: (done: number, total: number) => void) {
  let pageToken: string | undefined
  const ids: string[] = []
  do {
    const params = new URLSearchParams({ q: query, maxResults: '500', fields: 'messages(id),nextPageToken' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await gmailFetch(`/messages?${params.toString()}`)
    for (const message of data?.messages || []) ids.push(message.id)
    pageToken = data?.nextPageToken
  } while (pageToken)

  onProgress?.(0, ids.length)
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000)
    await gmailFetch('/messages/batchModify', {
      method: 'POST',
      body: JSON.stringify({ ids: chunk, addLabelIds: ['TRASH'], removeLabelIds: ['INBOX'] }),
    })
    onProgress?.(Math.min(i + chunk.length, ids.length), ids.length)
  }
  return ids
}

export async function undoTrashMessageIds(ids: string[]) {
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000)
    await gmailFetch('/messages/batchModify', {
      method: 'POST',
      body: JSON.stringify({ ids: chunk, addLabelIds: ['INBOX'], removeLabelIds: ['TRASH'] }),
    })
  }
}

export function getProtectedSenders(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(PROTECTED_KEY) || '[]')
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function setProtectedSender(sender: string, protectedMode: boolean) {
  const normalized = sender.trim().toLowerCase()
  const senders = getProtectedSenders().filter((item) => item !== normalized)
  if (protectedMode) senders.push(normalized)
  localStorage.setItem(PROTECTED_KEY, JSON.stringify(senders))
}
