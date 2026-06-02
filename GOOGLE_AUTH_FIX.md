# 🔐 Google Drive OAuth Sign-In Fix - Root Cause & Solution

## Problem Summary
**Error:** "Google sign in failed something went wrong" when connecting Google Drive in settings after installing the APK

---

## 🎯 ROOT CAUSE ANALYSIS

### The Issue
Your Android APK is built with a **debug keystore** that has a specific SHA-1 fingerprint:
```
79:8F:D9:E2:BE:C1:A7:85:91:A9:06:AE:04:46:05:6E:F9:F8:79:14
```

However, this SHA-1 fingerprint is **NOT registered in Google Cloud Console**, causing Google's OAuth service to reject authentication requests from your app.

### Why This Happens
Google requires exact SHA-1 certificate fingerprint matching for Android apps because:
1. **Security verification** - Google validates that OAuth requests come from your legitimate app
2. **Package verification** - Ensures `com.selfsync.app` hasn't been tampered with
3. **Anti-spoofing** - Prevents other apps from impersonating your app to steal Google Drive tokens

---

## ✅ BULLET-PROOF SOLUTION

### Step 1: Get Your SHA-1 Fingerprint ✓ (Already Done)
Your SHA-1 from the built APK:
```
79:8F:D9:E2:BE:C1:A7:85:91:A9:06:AE:04:46:05:6E:F9:F8:79:14
```

### Step 2: Register SHA-1 in Google Cloud Console

1. **Go to Google Cloud Console:**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Find OAuth Credentials:**
   - Left sidebar → "Credentials"
   - Look for **"SelfSync"** or **"com.selfsync.app"** OAuth Client (type: Android)

3. **Add SHA-1 Fingerprint:**
   - Click on the Android OAuth client to edit
   - Find section: **"SHA-1 certificate fingerprints"**
   - Paste: `79:8F:D9:E2:BE:C1:A7:85:91:A9:06:AE:04:46:05:6E:F9:F8:79:14`
   - Click **"Save"**

### Step 3: Enable OAuth Consent Screen
1. Go to "OAuth Consent Screen" in Google Cloud Console
2. Ensure your app is set to **"Testing"** or **"Production"**
3. Your Google account should be in the **"Test users"** list

### Step 4: Verify APK is Signed Correctly
Run this command to verify your APK's signing certificate:
```bash
unzip -p android/app/build/outputs/apk/debug/app-debug.apk META-INF/CERT.RSA | \
  keytool -printcert -v | grep SHA1
```

---

## 🚀 Installation & Testing

### 1. Clear Previous Authentication
```bash
# Clear app data to remove old (failed) token cache
adb shell pm clear com.selfsync.app

# Uninstall if already installed
adb uninstall com.selfsync.app
```

### 2. Install Fresh APK
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Test Google Drive Connection
1. Open SelfSync app on phone
2. Go to Settings
3. Click "Connect Google Drive"
4. **Should now see Google login dialog** ✓

---

## 📋 Configuration Checklist

- [ ] SHA-1 `79:8F:D9:E2:BE:C1:A7:85:91:A9:06:AE:04:46:05:6E:F9:F8:79:14` is registered in Google Cloud Console
- [ ] OAuth Client type is **Android**
- [ ] Package name is **com.selfsync.app**
- [ ] OAuth Consent Screen is configured
- [ ] Your Google account is in Test users list
- [ ] APK has been reinstalled after Google Cloud Console changes
- [ ] App data has been cleared

---

## 🔧 If Google Sign-In Still Fails

### Diagnostic Steps
1. **Check logcat for detailed errors:**
   ```bash
   adb logcat | grep -i "google\|auth\|oauth"
   ```

2. **Verify environment variables are set in GitHub Actions:**
   - ✅ `NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` - must be set
   - ✅ `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` - must be set

3. **Confirm Capacitor configuration:**
   ```bash
   cat capacitor.config.ts | grep -A5 GoogleAuth
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Device not registered" | Add SHA-1 to Google Cloud Console > Credentials |
| "Invalid OAuth Client" | Verify `NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is correct |
| "403 Forbidden" | OAuth Client may be disabled - check Google Cloud Console |
| "Network error" | May be timeout - ensure internet connection is stable |

---

## 🔄 Updated Build Workflow

The improved GitHub Actions workflow now:
1. ✅ Automatically extracts SHA-1 from keystore during build
2. ✅ Displays SHA-1 in build logs for easy reference
3. ✅ Validates Google Auth configuration before APK compilation
4. ✅ Verifies APK signing certificate after build
5. ✅ Provides troubleshooting guide in build summary

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/android-apk.yml` | Build workflow with Google Auth validation |
| `capacitor.config.ts` | Capacitor GoogleAuth plugin configuration |
| `src/lib/sync/gdrive-auth.ts` | Google Drive authentication implementation |
| `android/app/build.gradle` | Android app signing configuration |

---

## ✨ Summary

**Root Cause:** SHA-1 fingerprint mismatch between APK and Google Cloud Console

**Solution:** Register the APK's SHA-1 fingerprint in Google Cloud Console OAuth credentials

**Your SHA-1 to Register:**
```
79:8F:D9:E2:BE:C1:A7:85:91:A9:06:AE:04:46:05:6E:F9:F8:79:14
```

This is a **permanent fix** - once registered, all future APKs built with the same keystore will work correctly.
