// ─── SelfSync WebRTC Transfer — PeerJS-based P2P Data Transfer ─────
// Uses PeerJS (free signaling at 0.peerjs.com) for WebRTC handshake.
// Single QR scan → connects → sends all encrypted backup data.

import Peer, { type DataConnection } from 'peerjs'

export interface WebRTCQRPayload {
  /** PeerJS peer ID of sender */
  peerId: string
  /** Device name for display */
  deviceName: string
  /** Backup data size hint (bytes before compression) */
  dataSize: number
  /** Number of data chunks */
  chunks: number
  /** App version */
  appVersion: string
}

export type WebRTCTransferState =
  | 'idle'
  | 'creating-peer'
  | 'waiting-connection'
  | 'connecting'
  | 'connected'
  | 'sending'
  | 'receiving'
  | 'complete'
  | 'failed'

export type WebRTCProgress = {
  received: number
  total: number
  bytesTransferred: number
  bytesTotal: number
}

type ChunkMessage = {
  type: 'chunk'
  index: number
  total: number
  data: string // base64 encoded encrypted chunk
  size: number
}

type AckMessage = {
  type: 'ack'
  index: number
}

type TransferInitMessage = {
  type: 'transfer-init'
  totalChunks: number
  totalBytes: number
}

// ─── Create sender peer ───
export function createSenderPeer(
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<{ peer: Peer; qrPayload: WebRTCQRPayload; whenConnected: Promise<DataConnection> }> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    const peer = new Peer('', {
      debug: 0, // 0 = no logs, 1 = errors, 2 = warnings
    })

    let connectionResolve: (conn: DataConnection) => void
    const whenConnected = new Promise<DataConnection>((resolve) => {
      connectionResolve = resolve
    })

    peer.on('open', (id) => {
      const payload: WebRTCQRPayload = {
        peerId: id,
        deviceName: typeof navigator !== 'undefined' ? getDeviceName() : 'SelfSync Device',
        dataSize: 0,
        chunks: 1,
        appVersion: '2.0.0',
      }

      // Wait for someone to connect
      peer.on('connection', (conn) => {
        onStateChange('connected')
        connectionResolve(conn)

        conn.on('close', () => {
          onStateChange('idle')
        })

        conn.on('error', (err) => {
          onError(err.message || 'Connection error')
          onStateChange('failed')
        })
      })

      resolve({ peer, qrPayload: payload, whenConnected })
    })

    peer.on('error', (err) => {
      const msg = err.type === 'unavailable-id'
        ? 'Failed to create transfer ID. Try again.'
        : err.type === 'network'
          ? 'Network error. Check internet or use QR mode.'
          : err.message || 'PeerJS error'
      onError(msg)
      onStateChange('failed')
      reject(err)
    })
  })
}

// ─── Sender sends backup data ───
export async function sendBackupViaWebRTC(
  conn: DataConnection,
  encryptedData: string,
  onProgress: (progress: WebRTCProgress) => void,
  onStateChange: (state: WebRTCTransferState) => void,
): Promise<void> {
  const CHUNK_SIZE = 64000 // 64KB per chunk
  const encoder = new TextEncoder()
  const bytes = encoder.encode(encryptedData)
  const totalChunks = Math.ceil(bytes.length / CHUNK_SIZE)

  onStateChange('sending')

  // Send init message first
  const initMsg: TransferInitMessage = {
    type: 'transfer-init',
    totalChunks,
    totalBytes: bytes.length,
  }
  conn.send(initMsg)

  // Wait a brief moment for receiver to process
  await new Promise((r) => setTimeout(r, 100))

  // Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, bytes.length)
    const chunk = bytes.slice(start, end)

    // Convert to base64 for safe transfer
    const base64 = arrayBufferToBase64(chunk)

    const msg: ChunkMessage = {
      type: 'chunk',
      index: i,
      total: totalChunks,
      data: base64,
      size: chunk.length,
    }

    conn.send(msg)

    // Update progress
    onProgress({
      received: i + 1,
      total: totalChunks,
      bytesTransferred: end,
      bytesTotal: bytes.length,
    })

    // Small yield to avoid buffer overflow
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 10))
    }
  }

  onStateChange('complete')
}

// ─── Receive backup data (called by receiver) ───
export function receiveBackupViaWebRTC(
  conn: DataConnection,
  onProgress: (progress: WebRTCProgress) => void,
  onStateChange: (state: WebRTCTransferState) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    onStateChange('receiving')

    const chunks: { index: number; data: string }[] = []
    let totalChunks = 0
    let totalBytes = 0
    let receivedBytes = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        conn.off('data', handler)
        reject(new Error('Transfer timed out'))
        onStateChange('failed')
      }, 30000) // 30s timeout
    }

    const handler = (data: unknown) => {
      resetTimeout()

      const msg = data as ChunkMessage | TransferInitMessage

      if (msg.type === 'transfer-init') {
        totalChunks = msg.totalChunks
        totalBytes = msg.totalBytes
        onProgress({
          received: 0,
          total: totalChunks,
          bytesTransferred: 0,
          bytesTotal: totalBytes,
        })
        return
      }

      if (msg.type === 'chunk') {
        chunks.push({ index: msg.index, data: msg.data })
        receivedBytes += msg.size

        onProgress({
          received: chunks.length,
          total: msg.total,
          bytesTransferred: receivedBytes,
          bytesTotal: totalBytes || receivedBytes,
        })

        if (chunks.length === msg.total) {
          if (timeoutId) clearTimeout(timeoutId)
          conn.off('data', handler)

          // Reassemble
          chunks.sort((a, b) => a.index - b.index)
          try {
            const combined = chunks.map((c) => base64ToArrayBuffer(c.data))
            const totalLen = combined.reduce((sum, arr) => sum + arr.byteLength, 0)
            const fullBuffer = new Uint8Array(totalLen)
            let offset = 0
            for (const arr of combined) {
              fullBuffer.set(new Uint8Array(arr), offset)
              offset += arr.byteLength
            }
            const decoder = new TextDecoder()
            const result = decoder.decode(fullBuffer)

            onStateChange('complete')
            resolve(result)
          } catch (err) {
            onStateChange('failed')
            reject(new Error('Failed to reassemble data'))
          }
        }
      }
    }

    conn.on('data', handler)
    conn.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId)
      onStateChange('failed')
      reject(new Error(err.message || 'WebRTC error'))
    })

    resetTimeout()
  })
}

// ─── Create receiver peer and connect to sender ───
export function createReceiverConnection(
  peerId: string,
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<DataConnection> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    const peer = new Peer('', {
      debug: 0,
    })

    peer.on('open', () => {
      onStateChange('connecting')

      const conn = peer.connect(peerId, {
        reliable: true,
        serialization: 'json',
      })

      const timeout = setTimeout(() => {
        reject(new Error('Connection timed out. Make sure both devices are on the same network or have internet access.'))
        onStateChange('failed')
      }, 15000)

      conn.on('open', () => {
        clearTimeout(timeout)
        onStateChange('connected')
        resolve(conn)
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        onError(err.message || 'Connection failed')
        onStateChange('failed')
        reject(err)
      })
    })

    peer.on('error', (err) => {
      onError(err.message || 'PeerJS error')
      onStateChange('failed')
      reject(err)
    })
  })
}

// ─── Helpers ───

function getDeviceName(): string {
  // Try to get a readable device name
  if (typeof navigator === 'undefined') return 'SelfSync Device'
  const ua = navigator.userAgent
  if (ua.includes('Android')) return 'Android Phone'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iPhone/iPad'
  if (ua.includes('Windows')) return 'Windows PC'
  return 'SelfSync Device'
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}