# Google Fit Sync Troubleshooting Guide

## Step 1: Check Browser Console

1. Open your app in the browser
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab
4. Try clicking "Sync Now" again
5. Look for error messages

The console will now show detailed logs like:
```
Session info: {hasSession: true, hasToken: true, provider: 'google'}
Fetching steps data from Google Fit...
Steps API response status: 403
Steps API error: {error: {...}}
```

## Common Errors & Solutions

### Error: 403 Forbidden / "Access Not Configured"

**Cause**: Google Fitness API is not enabled in your Google Cloud project

**Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services → Library**
4. Search for "**Fitness API**"
5. Click on it and click **ENABLE**
6. Wait 1-2 minutes for it to activate
7. Try syncing again

### Error: 401 Unauthorized

**Cause**: Access token is invalid or expired

**Fix**:
1. Sign out of your app
2. Sign in with Google again
3. Make sure you **grant permissions** on the consent screen
4. Try syncing

### Error: "Insufficient scopes"

**Cause**: You didn't grant Fitness permissions during sign-in

**Fix**:
1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find your app
3. Click "Remove access"
4. Go back to your app
5. Sign out
6. Sign in with Google again
7. **Carefully grant all permissions** (Activity and Heart Rate)

### Error: No token / Session info shows hasToken: false

**Cause**: Not signed in with Google, or signed in with email/password

**Fix**:
1. Sign out
2. Click **"Sign in with Google"** (not email/password)
3. Complete Google OAuth flow
4. Should now work

## Step 2: Verify Google Cloud Setup

### Required APIs:
- ✅ **Fitness API** - MUST be enabled
- ✅ **People API** - Should be enabled (usually auto-enabled)

### OAuth Consent Screen:
1. Go to **APIs & Services → OAuth consent screen**
2. Make sure these scopes are added:
   ```
   https://www.googleapis.com/auth/fitness.activity.read
   https://www.googleapis.com/auth/fitness.heart_rate.read
   ```
3. If "Testing" mode: Add your email to test users

## Step 3: Check Supabase Configuration

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Verify:
   - ✅ Enabled: ON
   - ✅ Client ID: Matches Google Cloud OAuth credentials
   - ✅ Client Secret: Matches Google Cloud OAuth credentials
   - ✅ Authorized redirect URIs in Google Cloud include:
     ```
     https://ozlmduqomteomyirbwgc.supabase.co/auth/v1/callback
     ```

## Step 4: Test with Sample Data

If Google Fit sync still doesn't work, you can test with:
1. **Manual Wearable Form** - Enter data manually
2. **Simulator** - Generate test data

This proves the backend works, narrowing down to Google Fit API issue.

## What the Console Logs Mean

### ✅ Success:
```
Session info: {hasSession: true, hasToken: true, provider: 'google'}
Fetching steps data from Google Fit...
Steps API response status: 200
Steps data received: {bucket: [...]}
Total steps: 8342
Fetching heart rate data from Google Fit...
Heart rate API response status: 200
Processed heart rate: 68 from 12 readings
Synced data: {steps: 8342, heartRate: 68, ...}
```

### ❌ Common Failures:

**No Google Fit data:**
```
Total steps: 0
Processed heart rate: 72 from 0 readings
```
- User doesn't have Google Fit installed
- No fitness tracker connected
- No data recorded yet

**API not enabled:**
```
Steps API response status: 403
Steps API error: {
  error: {
    code: 403,
    message: "Google Fitness API has not been used..."
  }
}
```
→ Enable Fitness API in Google Cloud

**Invalid token:**
```
Steps API response status: 401
```
→ Sign in with Google again

**Wrong scopes:**
```
error: {
  code: 403,
  message: "Request had insufficient authentication scopes"
}
```
→ Revoke and re-grant permissions

## Quick Checklist

Before asking for help, verify:

- [ ] Signed in with Google (not email/password)
- [ ] Fitness API enabled in Google Cloud Console
- [ ] OAuth credentials configured in Supabase
- [ ] Granted permissions during Google sign-in
- [ ] Browser console shows detailed error logs
- [ ] Google Fit app installed and has data (for real testing)

## Still Not Working?

Share the console logs (press F12 → Console tab) showing:
- Session info
- API response status
- Any error messages

This will help identify the exact issue!
