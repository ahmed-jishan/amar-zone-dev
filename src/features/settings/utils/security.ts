export function hashPin(pin: string): string {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    const c = pin.charCodeAt(i)
    hash = (hash << 5) - hash + c
    hash |= 0
  }
  return String(hash)
}

export function verifyPin(pin: string, pinHash?: string): boolean {
  return !!pinHash && hashPin(pin) === pinHash
}
