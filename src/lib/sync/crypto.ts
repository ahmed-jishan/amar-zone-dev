const TEXT_ENCODER = new TextEncoder()
const TEXT_DECODER = new TextDecoder()

const PBKDF2_ITERATIONS = 100000
const SALT_BYTES = 16
const IV_BYTES = 12

export type EncryptedData = {
  v: 1
  alg: 'AES-GCM'
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export async function encryptData(data: unknown, password: string): Promise<string> {
  if (!password.trim()) throw new Error('Sync password is required')

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(password, salt)
  const plaintext = TEXT_ENCODER.encode(JSON.stringify(data))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext))

  const payload: EncryptedData = {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  }

  return toBase64(TEXT_ENCODER.encode(JSON.stringify(payload)))
}

export async function decryptData<T = unknown>(encryptedBase64: string, password: string): Promise<T> {
  if (!password.trim()) throw new Error('Sync password is required')

  const envelope = JSON.parse(TEXT_DECODER.decode(fromBase64(encryptedBase64))) as EncryptedData
  if (envelope.v !== 1 || envelope.alg !== 'AES-GCM' || envelope.kdf !== 'PBKDF2-SHA256') {
    throw new Error('Unsupported encrypted backup format')
  }

  const salt = fromBase64(envelope.salt)
  const iv = fromBase64(envelope.iv)
  const ciphertext = fromBase64(envelope.ciphertext)
  const key = await deriveKey(password, salt, envelope.iterations)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext))
  return JSON.parse(TEXT_DECODER.decode(decrypted)) as T
}

async function deriveKey(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(TEXT_ENCODER.encode(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}
