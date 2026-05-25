import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'

type BiometricStatus = {
  available: boolean
  native: boolean
  reason?: string
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (Capacitor.getPlatform() === 'web') {
    return { available: false, native: false, reason: 'Native biometric auth is only available inside the installed app.' }
  }

  try {
    const result = await NativeBiometric.isAvailable({ useFallback: true })
    return { available: result.isAvailable, native: true, reason: result.isAvailable ? undefined : 'No enrolled biometric or device credential found.' }
  } catch (error) {
    return { available: false, native: true, reason: error instanceof Error ? error.message : 'Biometric auth is unavailable.' }
  }
}

export async function verifyDeviceBiometric(): Promise<boolean> {
  if (Capacitor.getPlatform() === 'web') return false

  try {
    await NativeBiometric.verifyIdentity({
      title: 'Unlock SelfSync',
      subtitle: 'Use your phone lock',
      description: 'Confirm with fingerprint, face unlock, or device PIN.',
      reason: 'Unlock SelfSync',
      negativeButtonText: 'Use app PIN',
      useFallback: true,
      fallbackTitle: 'Use app PIN',
      maxAttempts: 3,
    })
    return true
  } catch {
    return false
  }
}
