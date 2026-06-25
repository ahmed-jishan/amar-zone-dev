# 🔐 Google Drive OAuth Sign-In - BULLETPROOF FIX

## ✅ Root Cause - PERMANENTLY FIXED

**Problem:** Every Android build machine uses a **different default debug keystore**, producing different SHA-1 fingerprints. Google's OAuth rejects unknown SHA-1 fingerprints.

**Solution:** Created a **project-specific debug keystore** (`android/app/debug.keystore`) that is:
- ✅ Tracked in Git (so all developers and CI use the SAME keystore)
- ✅ Configured in `android/app/build.gradle` as the default debug signing config
- ✅ Produces the **SAME SHA-1 on every build, forever**

---

## 🔑 Your New SHA-1 Fingerprint

```
1D:C4:51:9E:BD:2C:8F:EC:25:4C:F8:97:D0:9C:EA:20:AE:8D:7E:7E
```

---

## 📋 How To Fix Google Sign-In (ONE TIME SETUP)

### Step 1: Add SHA-1 to Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Select your project
3. Left sidebar → **Credentials**
4. Find the **Android OAuth client** for `com.selfsync.app`
5. Click **Edit** (pencil icon)
6. In **"SHA-1 certificate fingerprints"** section, add:
   ```
   1D:C4:51:9E:BD:2C:8F:EC:25:4C:F8:97:D0:9C:EA:20:AE:8D:7E:7E
   ```
7. Click **Save**

### Step 2: Verify OAuth Consent Screen

1. Go to **OAuth Consent Screen**
2. Ensure app status is **"Testing"** or **"In production"**
3. Add your Google account to **Test users** (if in Testing mode)

### Step 3: Clear Old Auth & Reinstall

```bash
adb uninstall com.selfsync.app
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔄 How This Fix Stays Permanent

| Factor | Before | After |
|--------|--------|-------|
| Keystore | Per-machine default (`%USERPROFILE%\.android\debug.keystore`) | Project-specific (`android/app/debug.keystore`) |
| SHA-1 | Changes on every machine | **Always the same** |
| Git-tracked | No | **Yes** |
| Google Console setup | Must re-add SHA-1 per machine | **Add once, done forever** |

---

## 🔧 Files Changed

| File | Change |
|------|--------|
| `android/app/debug.keystore` | **NEW** - Project-specific debug keystore (tracked in Git) |
| `android/app/build.gradle` | Modified - Uses `projectDebug` signing config with the new keystore |
| `.gitignore` | Modified - Allows `android/app/debug.keystore` to be tracked |
| `GOOGLE_AUTH_FIX.md` | Updated - New SHA-1 and instructions |

---

## 🧪 Verify the Fix

Run this to confirm your APK's SHA-1:
```bash
keytool -printcert -jarfile android/app/build/outputs/apk/debug/app-debug.apk | grep SHA1
```

Expected output:
```
SHA1: 1D:C4:51:9E:BD:2C:8F:EC:25:4C:F8:97:D0:9C:EA:20:AE:8D:7E:7E
```

---

## ✅ This Fix is BULLETPROOF Because

1. **Same keystore on every machine** - The `debug.keystore` is in the repo
2. **Same SHA-1 on every build** - No more "configuration mismatch" errors
3. **Works on any dev machine** - Pull, build, install, works immediately
4. **Works in CI/CD** - GitHub Actions, GitLab CI, etc. all produce the same SHA-1
5. **One-time Google Console setup** - Add SHA-1 once, never touch it again

---

## ❌ If Still Failing After This Fix

1. **Check the SHA-1 matches** what you added in Google Cloud Console
2. **Verify both OAuth clients in the same project**:
   - Web client: `1015865101368-f64lta5461e0ns0m2mj0mtejaqqugodh.apps.googleusercontent.com`
   - Android client: `1015865101368-3dj3bdaikbr2a58kmg5jespf17f607qi.apps.googleusercontent.com`
3. **Enable Google Drive API** in Google Cloud Console
4. **Run logcat** for detailed errors:
   ```bash
   adb logcat | grep -iE "google|auth|oauth"