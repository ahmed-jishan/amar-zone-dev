import Peer, { type DataConnection } from 'peerjs'

export interface WebRTCQRPayload {
  peerId: string
  deviceName: string
  dataSize: number
  chunks: number
  appVersion: string
  protocolVersion: number
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
  speedBytesPerSecond?: number
  etaSeconds?: number
  retries?: number
}

type TransferInitMessage = {
  type: 'transfer-init'
  sessionId: string
  totalChunks: number
  totalBytes: number
  checksum: string
}

type ChunkMessage = {
  type: 'chunk'
  sessionId: string
  index: number
  total: number
  data: string
  size: number
  checksum: string
}

type AckMessage = {
  type: 'ack'
  sessionId: string
  index: number
}

type TransferCompleteMessage = {
  type: 'transfer-complete'
  sessionId: string
}

type TransferAbortMessage = {
  type: 'transfer-abort'
  sessionId: string
  reason: string
}

type PingMessage = {
  type: 'ping'
  ts: number
}

type PongMessage = {
  type: 'pong'
  ts: number
}

type TransferMessage =
  | TransferInitMessage
  | ChunkMessage
  | AckMessage
  | TransferCompleteMessage
  | TransferAbortMessage
  | PingMessage
  | PongMessage

// Tuning constants
const CHUNK_SIZE = 16_384
const ACK_TIMEOUT_MS = 10_000
const MAX_RETRIES = 15
const TRANSFER_TIMEOUT_MS = 300_000
const CONNECT_TIMEOUT_MS = 60_000
const PROTOCOL_VERSION = 3
const PING_INTERVAL_MS = 10_000
const PING_TIMEOUT_MS = 40_000

function getIceServers(): RTCIceServer[] {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: [
        'turn:global.relay.metered.ca:80',
        'turn:global.relay.metered.ca:443',
        'turn:global.relay.metered.ca:80?transport=tcp',
        'turn:global.relay.metered.ca:443?transport=tcp',
      ],
      username: '7b4c8ef2c417b1a42e3b91e9',
      credential: 'xuJpQqw3Tbi7K/mx',
    },
  ]
}

export function createSenderPeer(
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<{ peer: Peer; qrPayload: WebRTCQRPayload; whenConnected: Promise<DataConnection> }> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    const peer = new Peer('', {
      debug: 0,
      config: { iceServers: getIceServers() },
    })

    let connectionResolve: (conn: DataConnection) => void = () => undefined
    let connectionReject: (reason: Error) => void = () => undefined

    const whenConnected = new Promise<DataConnection>((resolveConnection, rejectConnection) => {
      connectionResolve = resolveConnection
      connectionReject = rejectConnection
    })

    const connectTimer = setTimeout(() => {
      connectionReject(new Error('Connection timed out. No receiver detected.'))
      onError('Connection timed out. Please try again.')
      onStateChange('failed')
      peer.destroy()
    }, CONNECT_TIMEOUT_MS)

    peer.on('open', (id) => {
      const payload: WebRTCQRPayload = {
        peerId: id,
        deviceName: typeof navigator !== 'undefined' ? getDeviceName() : 'SelfSync Device',
        dataSize: 0,
        chunks: 1,
        appVersion: '3.0.0',
        protocolVersion: PROTOCOL_VERSION,
      }

      peer.on('connection', (conn) => {
        clearTimeout(connectTimer)

        conn.on('close', () => {
          onStateChange('idle')
        })

        conn.on('error', (err) => {
          onError(err.message || 'Connection error')
          onStateChange('failed')
        })

        if (conn.open) {
          onStateChange('connected')
          connectionResolve(conn)
          return
        }

        conn.on('open', () => {
          onStateChange('connected')
          connectionResolve(conn)
        })
      })

      resolve({ peer, qrPayload: payload, whenConnected })
    })

    peer.on('error', (err) => {
      clearTimeout(connectTimer)
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

export async function sendBackupViaWebRTC(
  conn: DataConnection,
  encryptedData: string,
  onProgress: (progress: WebRTCProgress) => void,
  onStateChange: (state: WebRTCTransferState) => void,
): Promise<void> {
  const bytes = new TextEncoder().encode(encryptedData)
  const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE))
  const startedAt = performance.now()
  let retries = 0
  let lastProgressTime = 0

  onStateChange('sending')
  onProgress(buildProgress(0, totalChunks, 0, bytes.length, startedAt, 0))

  const stopKeepalive = startKeepalive(conn)

  try {
    const totalBytes = bytes.length
    const checksum = await sha256Hex(bytes)

    await waitForConnectionOpen(conn)
    queueSend(conn, {
      type: 'transfer-init',
      sessionId: createSessionId(),
      totalChunks,
      totalBytes,
      checksum,
    })

    let bytesSent = 0
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, bytes.length)
      const chunkBytes = bytes.slice(start, end)
      const chunkB64 = arrayBufferToBase64(chunkBytes)
      const chunkChecksum = await sha256Hex(chunkBytes)

      let chunkRetries = 0
      let acked = false

      while (!acked && chunkRetries < MAX_RETRIES) {
        try {
          await waitForConnectionOpen(conn)
          queueSend(conn, {
            type: 'chunk',
            sessionId: createSessionId(),
            index,
            total: totalChunks,
            data: chunkB64,
            size: chunkBytes.length,
            checksum: chunkChecksum,
          })

          await waitForAck(conn, index, ACK_TIMEOUT_MS)
          acked = true
        } catch (err) {
          chunkRetries++
          retries++
          if (chunkRetries >= MAX_RETRIES) {
            throw new Error('Failed to send chunk ' + index + ' after ' + MAX_RETRIES + ' retries.')
          }
          await new Promise(r => setTimeout(r, 200 * chunkRetries))
        }
      }

      bytesSent += chunkBytes.length

      const now = performance.now()
      if (now - lastProgressTime > 50) {
        onProgress(buildProgress(index + 1, totalChunks, bytesSent, totalBytes, startedAt, retries))
        await yieldToUI()
        lastProgressTime = now
      }
    }

    await waitForConnectionOpen(conn)
    queueSend(conn, {
      type: 'transfer-complete',
      sessionId: createSessionId(),
    })

    onProgress(buildProgress(totalChunks, totalChunks, totalBytes, totalBytes, startedAt, retries))
    await yieldToUI()
    onStateChange('complete')
  } catch (err) {
    onStateChange('failed')
    throw err
  } finally {
    stopKeepalive()
  }
}

export function createReceiverConnection(
  senderPeerId: string,
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<{ conn: DataConnection; peer: Peer }> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    let peer: Peer | null = null
    let disposed = false
    const cleanUp = () => {
      disposed = true
      try { peer?.destroy() } catch { }
    }

    const connectTimer = setTimeout(() => {
      if (!disposed) {
        cleanUp()
        onError('Connection timed out. Could not reach sender device.')
        onStateChange('failed')
        reject(new Error('Receiver connection timeout'))
      }
    }, CONNECT_TIMEOUT_MS)

    peer = new Peer('', {
      debug: 0,
      config: { iceServers: getIceServers() },
    })

    peer.on('open', () => {
      if (disposed) return
      onStateChange('connecting')

      const conn = peer.connect(senderPeerId, {
        reliable: true,
        serialization: 'json',
      })

      conn.on('open', () => {
        if (disposed) return
        clearTimeout(connectTimer)
        onStateChange('connected')
        resolve({ conn, peer: peer! })
      })

      conn.on('error', (err) => {
        if (disposed) return
        cleanUp()
        onError(err.message || 'Connection failed')
        onStateChange('failed')
        reject(err)
      })
    })

    peer.on('error', (err) => {
      if (disposed) return
      cleanUp()
      clearTimeout(connectTimer)
      const msg = err.type === 'network'
        ? 'Network error. Check internet or use QR mode.'
        : err.message || 'Failed to create receiver peer'
      onError(msg)
      onStateChange('failed')
      reject(err)
    })
  })
}

export async function receiveBackupViaWebRTC(
  conn: DataConnection,
  onProgress: (progress: WebRTCProgress) => void,
  onStateChange: (state: WebRTCTransferState) => void,
  abortSignal?: AbortSignal,
): Promise<string> {
  onStateChange('receiving')

  const chunks = new Map<number, ArrayBuffer>()
  let transferInit: any = null
  let bytesReceived = 0
  let startedAt = performance.now()
  let lastProgressTime = 0
  let resolvePromise: (value: string) => void = () => undefined
  let rejectPromise: (reason: Error) => void = () => undefined
  let settled = false

  const stopKeepalive = startKeepalive(conn)

  const transferTimer = setTimeout(() => {
    if (!settled) {
      settled = true
      stopKeepalive()
      cleanup()
      onStateChange('failed')
      rejectPromise(new Error('Transfer timed out'))
    }
  }, TRANSFER_TIMEOUT_MS)

  const ackedChunks = new Set<number>()

  const handleMessage = (raw: unknown) => {
    if (settled) return
    const msg = raw as any

    if (msg.type === 'ping') {
      queueSend(conn, { type: 'pong', ts: (msg as PingMessage).ts })
      return
    }
    if (msg.type === 'pong') return

    if (msg.type === 'transfer-init' && isValidInit(msg)) {
      transferInit = msg
      startedAt = performance.now()
      onStateChange('receiving')
      onProgress(buildProgress(0, msg.totalChunks, 0, msg.totalBytes, startedAt, 0))
      return
    }

    if (msg.type === 'chunk' && isValidChunk(msg) && transferInit) {
      if (!ackedChunks.has(msg.index)) {
        ackedChunks.add(msg.index)
        const buffer = base64ToArrayBuffer(msg.data)
        chunks.set(msg.index, buffer)
        bytesReceived += msg.size
        onProgress(buildProgress(chunks.size, transferInit.totalChunks, bytesReceived, transferInit.totalBytes, startedAt, 0))
      }
      queueSend(conn, { type: 'ack', sessionId: transferInit.sessionId, index: msg.index })
      if (chunks.size === transferInit.totalChunks) {
        finishTransfer()
      }
      return
    }

    if (msg.type === 'transfer-complete') {
      finishTransfer()
      return
    }

    if (msg.type === 'transfer-abort') {
      if (!settled) {
        settled = true
        stopKeepalive()
        cleanup()
        onStateChange('failed')
        rejectPromise(new Error(msg.reason || 'Sender aborted transfer'))
      }
      return
    }
  }

  const finishTransfer = async () => {
    if (settled) return
    settled = true
    stopKeepalive()
    cleanup()
    clearTimeout(transferTimer)
    try {
      if (!transferInit) {
        rejectPromise(new Error('No transfer init received'))
        return
      }
      onStateChange('receiving')
      const data = await reassembleChunks(chunks, transferInit.totalChunks, transferInit.checksum)
      onProgress(buildProgress(transferInit.totalChunks, transferInit.totalChunks, transferInit.totalBytes, transferInit.totalBytes, startedAt, 0))
      await yieldToUI()
      onStateChange('complete')
      resolvePromise(data)
    } catch (err) {
      onStateChange('failed')
      rejectPromise(err instanceof Error ? err : new Error('Reassembly failed'))
    }
  }

  const cleanup = () => {
    conn.off('data', handleMessage)
    if (abortSignal) abortSignal.removeEventListener('abort', onAbort)
  }

  const onAbort = () => {
    if (!settled) {
      settled = true
      stopKeepalive()
      cleanup()
      clearTimeout(transferTimer)
      onStateChange('failed')
      rejectPromise(new Error('Transfer aborted'))
    }
  }

  conn.on('data', handleMessage)
  if (abortSignal) abortSignal.addEventListener('abort', onAbort)

  return new Promise<string>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
}

function startKeepalive(conn: DataConnection): () => void {
  let lastPongTime = Date.now()
  let dead = false

  const pongHandler = (raw: unknown) => {
    const msg = raw as any
    if (msg.type === 'pong') {
      lastPongTime = Date.now()
    }
  }

  conn.on('data', pongHandler)

  const interval = setInterval(() => {
    if (dead) return
    if (Date.now() - lastPongTime > PING_TIMEOUT_MS) {
      dead = true
      conn.off('data', pongHandler)
      clearInterval(interval)
      return
    }
    try {
      if (conn.open) {
        conn.send({ type: 'ping', ts: Date.now() })
      }
    } catch { }
  }, PING_INTERVAL_MS)

  return () => {
    dead = true
    conn.off('data', pongHandler)
    clearInterval(interval)
  }
}

async function waitForAck(conn: DataConnection, expectedIndex: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        conn.off('data', handler)
        reject(new Error('Ack timeout for chunk ' + expectedIndex))
      }
    }, timeoutMs)

    const handler = (raw: unknown) => {
      if (settled) return
      const msg = raw as any
      if (msg.type === 'ack' && msg.index === expectedIndex) {
        settled = true
        clearTimeout(timer)
        conn.off('data', handler)
        resolve()
      }
    }

    conn.on('data', handler)
  })
}

function waitForConnectionOpen(conn: DataConnection): Promise<void> {
  if (conn.open) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Connection open timeout')) }, 10_000)
    const handleOpen = () => { cleanup(); resolve() }
    const handleClose = () => { cleanup(); reject(new Error('Connection closed')) }
    const handleError = (error: Error) => { cleanup(); reject(error) }
    const cleanup = () => {
      clearTimeout(timeout)
      conn.off('open', handleOpen)
      conn.off('close', handleClose)
      conn.off('error', handleError)
    }
    conn.on('open', handleOpen)
    conn.on('close', handleClose)
    conn.on('error', handleError)
  })
}

function queueSend(conn: DataConnection, message: TransferMessage): void {
  if (conn.open) { conn.send(message); return }
  setTimeout(() => {
    if (conn.open) conn.send(message)
    else setTimeout(queueSend.bind(null, conn, message), 100)
  }, 100)
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i += 1) { binary += String.fromCharCode(buffer[i]) }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) { bytes[i] = binary.charCodeAt(i) }
  return bytes.buffer
}

function createSessionId(): string {
  const r = crypto.getRandomValues(new Uint32Array(2))
  return Date.now().toString(36) + '-' + r[0].toString(36) + '-' + r[1].toString(36)
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function buildProgress(received: number, total: number, bt: number, btotal: number, startedAt: number, retries: number): WebRTCProgress {
  const elapsed = Math.max((performance.now() - startedAt) / 1000, 0.001)
  const speed = bt / elapsed
  const remaining = Math.max(btotal - bt, 0)
  return { received, total, bytesTransferred: bt, bytesTotal: btotal, speedBytesPerSecond: speed, etaSeconds: speed > 0 ? remaining / speed : undefined, retries }
}

function isValidInit(value: any): value is TransferInitMessage {
  return value.type === 'transfer-init' && typeof value.sessionId === 'string' && typeof value.totalChunks === 'number' && value.totalChunks > 0 && typeof value.totalBytes === 'number' && value.totalBytes >= 0 && typeof value.checksum === 'string'
}

function isValidChunk(value: any): value is ChunkMessage {
  return value.type === 'chunk' && typeof value.sessionId === 'string' && typeof value.index === 'number' && typeof value.total === 'number' && typeof value.data === 'string' && typeof value.size === 'number' && typeof value.checksum === 'string' && value.index >= 0 && value.index < value.total
}

async function reassembleChunks(chunks: Map<number, ArrayBuffer>, totalChunks: number, expectedChecksum: string): Promise<string> {
  const ordered: Uint8Array[] = []
  for (let i = 0; i < totalChunks; i++) {
    const c = chunks.get(i)
    if (!c) throw new Error('Missing chunk ' + i)
    ordered.push(new Uint8Array(c))
  }
  const total = ordered.reduce((s, c) => s + c.byteLength, 0)
  const buf = new Uint8Array(total)
  let off = 0
  ordered.forEach(c => { buf.set(c, off); off += c.byteLength })
  const cs = await sha256Hex(buf)
  if (cs !== expectedChecksum) throw new Error('Integrity check failed')
  return new TextDecoder().decode(buf)
}

function yieldToUI(): Promise<void> {
  return new Promise(r => setTimeout(r, 0))
}

function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'SelfSync Device'
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS Device'
  if (/windows/i.test(ua)) return 'Windows PC'
  if (/mac/i.test(ua)) return 'Mac'
  if (/linux/i.test(ua)) return 'Linux PC'
  return navigator.platform || 'SelfSync Device'
}
