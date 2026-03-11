# Google Fit Integration Setup Guide

## ✅ What You've Added

1. **Google Sign-in Button** on the auth page
2. **Google Fit Sync Component** that automatically fetches real health data
3. **Real-time tracking** of steps and heart rate from Google Fit

## 🔧 How to Configure (Required for Production)

### Step 1: Enable Google OAuth in Supabase

1. Go to your **Supabase Dashboard**: https://app.supabase.com/project/ozlmduqomteomyirbwgc
2. Navigate to **Authentication → Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Sign in with Google**

### Step 2: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Google Fitness API**
   - **People API**

### Step 3: Create OAuth Credentials

1. In Google Cloud Console, go to **APIs & Services → Credentials**
2. Click **+ CREATE CREDENTIALS → OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   ```
   https://ozlmduqomteomyirbwgc.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client Secret**

### Step 4: Configure in Supabase

1. Back in Supabase → Authentication → Providers → Google
2. Paste your **Client ID**
3. Paste your **Client Secret**
4. Click **Save**

### Step 5: Add Scopes (Important!)

The app requests these Google Fit scopes automatically:
- `https://www.googleapis.com/auth/fitness.activity.read` - Read step count
- `https://www.googleapis.com/auth/fitness.heart_rate.read` - Read heart rate

These are already configured in the code!

## 🎯 How It Works

### User Flow:
1. User clicks **"Sign in with Google"** on auth page
2. Google OAuth consent screen shows requesting Fit permissions
3. User grants access
4. App stores the access token
5. **Google Fit Sync** component fetches real data:
   - Daily step count
   - Heart rate measurements
6. Data automatically submits to your backend
7. No manual entry needed!

### Data Fetched:
- **Steps**: Total steps for today from Google Fit
- **Heart Rate**: Average resting heart rate from last 24h
- **Last Synced**: Timestamp of last successful sync

### Advantages:
✅ **Real data** - No user lying or estimation  
✅ **Automatic** - Syncs with one click  
✅ **Comprehensive** - Pulls from all connected devices (phone, watch, etc.)  
✅ **Accurate** - Google Fit aggregates from multiple sources  

## 🚀 For Local Testing (Without Google Setup)

The app will work locally even without Google OAuth configured:
- Email/password login still works
- Manual wearable form available
- Simulator for testing
- Google Fit shows "Not Connected" state

Once you configure Google OAuth in Supabase, the Google Fit integration will work automatically!

## 📱 Supported Devices

Google Fit syncs data from:
- Android phones (step counter)
- Wear OS smartwatches
- Samsung Galaxy Watch
- Fitbit (if connected to Google Fit)
- Any app that writes to Google Fit

## 🔒 Privacy & Security

- Access tokens stored securely in Supabase session
- Only reads data (never writes)
- User can revoke access anytime in Google Account settings
- No raw data stored - only processed scores

## 🎨 What You'll See

### Auth Page:
- Email/password fields (existing)
- "Or continue with" divider
- **Google Sign-in button** with Google logo
- Text: "Connect Google Fit for automatic health tracking"

### Dashboard Wearables Tab:
- **Google Fit Integration card** (top)
  - Shows connection status
  - Displays synced data (steps, heart rate)
  - "Sync Now" button
  - Last synced timestamp
- Manual Wearable Form (middle)
- Simulator (bottom)

## 📝 Next Steps

1. **Test locally** - Google login button is ready
2. **Configure Google OAuth** - Follow steps above when ready for production
3. **Deploy** - Push to git, Lovable auto-deploys
4. **Test with real data** - Sign in with Google and sync!

## 🐛 Troubleshooting

**"Not connected" even after Google login:**
- Check if Google OAuth is enabled in Supabase
- Verify redirect URIs match exactly
- Ensure Google Fit API is enabled in Google Cloud

**"Failed to sync" error:**
- User needs to have Google Fit app installed
- Need to grant fitness permissions during login
- Check browser console for detailed errors

**No heart rate data:**
- Not all devices track heart rate
- User needs a smartwatch or fitness tracker
- Falls back to default (72 bpm) if unavailable
