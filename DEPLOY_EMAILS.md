# 🚀 GET REAL EMAILS WORKING - 3 Simple Steps

## Step 1: Login to Supabase
```powershell
npx supabase login
```
- Press Enter when prompted
- Browser will open
- Click "Authorize" button
- Come back to terminal

## Step 2: Link Your Project
```powershell
npx supabase link --project-ref ozlmduqomteomyirbwgc
```
- Enter your Supabase database password when asked
- This connects your local code to your cloud project

## Step 3: Add Resend API Key to Supabase

1. Go to: https://supabase.com/dashboard/project/ozlmduqomteomyirbwgc/settings/functions
2. Click **"Add secret"**  
3. Name: `RESEND_API_KEY`
4. Value: `re_YmDmZSwo_NWVc5boYcERrWc7E7xo2uLj6` (your key from earlier)
5. Click **"Save"**

## Step 4: Deploy Email Function
```powershell
npx supabase functions deploy send-appointment-notification
```
- This uploads your email code to Supabase cloud
- Takes ~30 seconds

## Step 5: Test Real Emails! 🎉

1. Refresh: http://localhost:8082
2. Go to **Professional Support** card
3. Click **"Request Appointment"**
4. Give consent → Click **"Send Request"**
5. **CHECK EMAIL**: ghostfather1234@gmail.com 📬

You should receive a beautiful HTML email!

---

## If It Doesn't Work:

Check browser console (F12) for errors:
- ✅ Should see: "Email sent successfully"
- ❌ If error: Screenshot it and show me

---

## Already Logged In?

Skip Step 1 and run directly:
```powershell
npx supabase link --project-ref ozlmduqomteomyirbwgc
npx supabase functions deploy send-appointment-notification
```

Then test on localhost! 🚀
