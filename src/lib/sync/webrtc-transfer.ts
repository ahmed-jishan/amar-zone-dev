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

type TransferMessage =
  | TransferInitMessage
  | ChunkMessage
  | AckMessage
  | TransferCompleteMessage
  | TransferAbortMessage

const CHUNK_SIZE = 48_000
const ACK_TIMEOUT_MS = 2500
const MAX_RETRIES = 5
const TRANSFER_TIMEOUT_MS = 45_000
const PROTOCOL_VERSION = 2

export function createSenderPeer(
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<{ peer: Peer; qrPayload: WebRTCQRPayload; whenConnected: Promise<DataConnection> }> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    const peer = new Peer('', { debug: 0 })

    let connectionResolve: (conn: DataConnection) => void = () => undefined
    const whenConnected = new Promise<DataConnection>((resolveConnection) => {
      connectionResolve = resolveConnection
    })

    peer.on('open', (id) => {
      const payload: WebRTCQRPayload = {
        peerId: id,
        deviceName: typeof navigator !== 'undefined' ? getDeviceName() : 'SelfSync Device',
        dataSize: 0,
        chunks: 1,
        appVersion: '2.0.0',
        protocolVersion: PROTOCOL_VERSION,
      }

      peer.on('connection', (conn) => {
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
  const sessionId = createSessionId()
  const transferChecksum = await sha256Hex(bytes)
  const startedAt = performance.now()
  let retries = 0

  await waitForConnectionOpen(conn)
  onStateChange('sending')

  const pendingAcks = new Map<number, () => void>()
  const ackHandler = (data: unknown) => {
    const msg = data as Partial<TransferMessage>
    if (msg.type !== 'ack' || msg.sessionId !== sessionId || typeof msg.index !== 'number') return
    const resolve = pendingAcks.get(msg.index)
    if (!resolve) return
    pendingAcks.delete(msg.index)
    resolve()
  }

  conn.on('data', ackHandler)

  try {
    sendWhenOpen(conn, {
      type: 'transfer-init',
      sessionId,
      totalChunks,
      totalBytes: bytes.length,
      checksum: transferChecksum,
    } satisfies TransferInitMessage)

    for (let i = 0; i < totalChunks; i += 1) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, bytes.length)
      const chunk = bytes.slice(start, end)
      const msg: ChunkMessage = {
        type: 'chunk',
        sessionId,
        index: i,
        total: totalChunks,
        data: arrayBufferToBase64(chunk),
        size: chunk.length,
        checksum: await sha256Hex(chunk),
      }

      let delivered = false
      let attempt = 0
      while (!delivered && attempt <= MAX_RETRIES) {
        sendWhenOpen(conn, msg)
        try {
          await waitForAck(i, pendingAcks)
          delivered = true
        } catch (error) {
          attempt += 1
          retries += 1
          if (attempt > MAX_RETRIES) throw error
        }
      }

      onProgress(buildProgress(i + 1, totalChunks, end, bytes.length, startedAt, retries))

      if (i % 8 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    sendWhenOpen(conn, { type: 'transfer-complete', sessionId } satisfies TransferCompleteMessage)
    onStateChange('complete')
  } catch (error) {
    if (conn.open) {
      conn.send({
        type: 'transfer-abort',
        sessionId,
        reason: error instanceof Error ? error.message : 'Transfer interrupted',
      } satisfies TransferAbortMessage)
    }
    onStateChange('failed')
    throw error
  } finally {
    conn.off('data', ackHandler)
    pendingAcks.clear()
  }
}

export function receiveBackupViaWebRTC(
  conn: DataConnection,
  onProgress: (progress: WebRTCProgress) => void,
  onStateChange: (state: WebRTCTransferState) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    onStateChange('receiving')

    const chunks = new Map<number, ArrayBuffer>()
    const seen = new Set<number>()
    let sessionId = ''
    let totalChunks = 0
    let totalBytes = 0
    let receivedBytes = 0
    let expectedChecksum = ''
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const startedAt = performance.now()

    const fail = (message: string) => {
      if (timeoutId) clearTimeout(timeoutId)
      conn.off('data', handler)
      onStateChange('failed')
      reject(new Error(message))
    }

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fail('Transfer timed out. Retry from the sender device.'), TRANSFER_TIMEOUT_MS)
    }

    const handler = (data: unknown) => {
      resetTimeout()
      void handleMessage(data).catch((error) => {
        fail(error instanceof Error ? error.message : 'Transfer failed.')
      })
    }

    const handleMessage = async (data: unknown) => {
      const msg = data as Partial<TransferMessage>

      if (msg.type === 'transfer-init') {
        if (!isValidInit(msg)) {
          fail('Invalid transfer session.')
          return
        }
        sessionId = msg.sessionId
        totalChunks = msg.totalChunks
        totalBytes = msg.totalBytes
        expectedChecksum = msg.checksum
        onProgress(buildProgress(0, totalChunks, 0, totalBytes, startedAt, 0))
        return
      }

      if (msg.type === 'chunk') {
        if (!isValidChunk(msg) || msg.sessionId !== sessionId || msg.total !== totalChunks) return

        if (!seen.has(msg.index)) {
          const buffer = base64ToArrayBuffer(msg.data)
          const checksum = await sha256Hex(new Uint8Array(buffer))
          if (checksum !== msg.checksum) {
            fail(`Chunk ${msg.index + 1} failed integrity validation.`)
            return
          }
          chunks.set(msg.index, buffer)
          seen.add(msg.index)
          receivedBytes += msg.size
        }

        sendWhenOpen(conn, { type: 'ack', sessionId, index: msg.index } satisfies AckMessage)
        onProgress(buildProgress(chunks.size, totalChunks, receivedBytes, totalBytes || receivedBytes, startedAt, 0))

        if (chunks.size === totalChunks) {
          if (timeoutId) clearTimeout(timeoutId)
          conn.off('data', handler)
          const result = await reassembleChunks(chunks, totalChunks, expectedChecksum)
          onStateChange('complete')
          resolve(result)
        }
        return
      }

      if (msg.type === 'transfer-abort' && msg.sessionId === sessionId) {
        fail(typeof msg.reason === 'string' ? msg.reason : 'Sender cancelled the transfer.')
      }
    }

    conn.on('data', handler)
    conn.on('error', (err) => {
      fail(err.message || 'WebRTC error')
    })

    resetTimeout()
  })
}

export function createReceiverConnection(
  peerId: string,
  onStateChange: (state: WebRTCTransferState) => void,
  onError: (error: string) => void,
): Promise<DataConnection> {
  return new Promise((resolve, reject) => {
    onStateChange('creating-peer')

    const peer = new Peer('', { debug: 0 })

    peer.on('open', () => {
      onStateChange('connecting')

      const conn = peer.connect(peerId, {
        reliable: true,
        serialization: 'json',
      })

      const timeout = setTimeout(() => {
        onStateChange('failed')
        reject(new Error('Connection timed out. Make sure both devices are online, then retry.'))
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

function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'SelfSync Device'
  const ua = navigator.userAgent
  if (ua.includes('Android')) return 'Android Phone'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iPhone/iPad'
  if (ua.includes('Windows')) return 'Windows PC'
  return 'SelfSync Device'
}

function waitForAck(index: number, pendingAcks: Map<number, () => void>): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingAcks.delete(index)
      reject(new Error(`Timed out waiting for chunk ${index + 1} acknowledgement`))
    }, ACK_TIMEOUT_MS)

    pendingAcks.set(index, () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function waitForConnectionOpen(conn: DataConnection, timeoutMs = 10000): Promise<void> {
  if (conn.open) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Connection is not ready yet. Please retry the scan.'))
    }, timeoutMs)

    const handleOpen = () => {
      cleanup()
      resolve()
    }
    const handleClose = () => {
      cleanup()
      reject(new Error('Connection closed before transfer started.'))
    }
    const handleError = (error: Error) => {
      cleanup()
      reject(error)
    }
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

function sendWhenOpen(conn: DataConnection, message: TransferMessage): void {
  if (!conn.open) {
    throw new Error('Connection is not open yet. Please retry the transfer.')
  }
  conn.send(message)
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i += 1) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function createSessionId(): string {
  const random = crypto.getRandomValues(new Uint32Array(2))
  return `${Date.now().toString(36)}-${random[0].toString(36)}-${random[1].toString(36)}`
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function buildProgress(
  received: number,
  total: number,
  bytesTransferred: number,
  bytesTotal: number,
  startedAt: number,
  retries: number,
): WebRTCProgress {
  const elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.001)
  const speedBytesPerSecond = bytesTransferred / elapsedSeconds
  const remainingBytes = Math.max(bytesTotal - bytesTransferred, 0)
  const etaSeconds = speedBytesPerSecond > 0 ? remainingBytes / speedBytesPerSecond : undefined

  return {
    received,
    total,
    bytesTransferred,
    bytesTotal,
    speedBytesPerSecond,
    etaSeconds,
    retries,
  }
}

function isValidInit(value: Partial<TransferMessage>): value is TransferInitMessage {
  return value.type === 'transfer-init' &&
    typeof value.sessionId === 'string' &&
    typeof value.totalChunks === 'number' &&
    value.totalChunks > 0 &&
    typeof value.totalBytes === 'number' &&
    value.totalBytes >= 0 &&
    typeof value.checksum === 'string'
}

function isValidChunk(value: Partial<TransferMessage>): value is ChunkMessage {
  return value.type === 'chunk' &&
    typeof value.sessionId === 'string' &&
    typeof value.index === 'number' &&
    typeof value.total === 'number' &&
    typeof value.data === 'string' &&
    typeof value.size === 'number' &&
    typeof value.checksum === 'string' &&
    value.index >= 0 &&
    value.index < value.total
}

async function reassembleChunks(
  chunks: Map<number, ArrayBuffer>,
  totalChunks: number,
  expectedChecksum: string,
): Promise<string> {
  const ordered: Uint8Array[] = []
  for (let index = 0; index < totalChunks; index += 1) {
    const chunk = chunks.get(index)
    if (!chunk) throw new Error('Transfer is missing a data chunk. Please retry.')
    ordered.push(new Uint8Array(chunk))
  }

  const totalLength = ordered.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const fullBuffer = new Uint8Array(totalLength)
  let offset = 0
  ordered.forEach((chunk) => {
    fullBuffer.set(chunk, offset)
    offset += chunk.byteLength
  })

  const checksum = await sha256Hex(fullBuffer)
  if (checksum !== expectedChecksum) {
    throw new Error('Transfer failed integrity validation. Please retry.')
  }

  return new TextDecoder().decode(fullBuffer)
}
