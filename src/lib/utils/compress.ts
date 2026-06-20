// ─── Gzip Compression for Quick Transfer ──────────────────────────────────────
// Uses pako (deflate) to compress backup data ~80% smaller.
// This allows most backups to fit in a SINGLE QR code instead of 3-4 frames.
// Supports fallback multi-frame for extremely large backups.

import pako from 'pako'

/**
 * Compress a string with gzip (deflate) and return base64-encoded result.
 * Typically reduces JSON backup size by 70–85%.
 */
export function compressText(text: string): string {
  const encoder = new TextEncoder()
  const inputBytes = encoder.encode(text)
  const compressed = pako.deflate(inputBytes, { level: 9 })
  return uint8ArrayToBase64(compressed)
}

/**
 * Decompress a base64-encoded gzip string back to original text.
 */
export function decompressText(compressedBase64: string): string {
  const compressedBytes = base64ToUint8Array(compressedBase64)
  const decompressed = pako.inflate(compressedBytes)
  const decoder = new TextDecoder()
  return decoder.decode(decompressed)
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Estimate compressed size ratio. Returns a number between 0–1
 * representing how much smaller the compressed data is.
 */
export function estimateCompressionRatio(text: string): number {
  const compressed = compressText(text)
  return compressed.length / text.length
}