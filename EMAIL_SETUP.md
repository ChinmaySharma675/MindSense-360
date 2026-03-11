# 📧 Real Email Setup Guide

Your psychiatrist appointment feature now sends **REAL EMAILS** via Resend API!

## 🚀 What Was Implemented

1. **Supabase Edge Function**: `send-appointment-notification`
   - Sends professional HTML emails to doctors
   - Beautiful email template with patient risk summary
   - Fallback to console logging if email service is down

2. **Updated Component**: PsychiatristCard now calls the edge function
   - Real-time email delivery
   - Error handling with fallback
   - Success notifications

## 📋 Step-by-Step Setup

### Step 1: Create Resend Account (FREE)

1. Go to **https://resend.com/signup**
2. Sign up with your email (FREE - 3,000 emails/month)
3. Verify your email address

### Step 2: Get API Key

1. After login, go to **API Keys** section
2. Click **"Create API Key"**
3. Name it: `MindSense Production`
4. Copy the API key (starts with `re_...`)
   - ⚠️ You'll only see this ONCE - save it securely!

### Step 3: Configure Domain (Optional but Recommended)

**Option A: Use Resend Test Domain (Immediate)**
- Emails will be sent from: `alerts@resend.dev`
- Works immediately, no setup required
- Good for testing

**Option B: Use Your Custom Domain (Professional)**
1. In Resend dashboard, click **"Domains"**
2. Add your domain (e.g., `mindsense.app`)
3. Add DNS records they provide to your domain registrar
4. Wait for verification (5-30 minutes)
5. Emails will be sent from: `alerts@mindsense.app`

### Step 4: Add API Key to Supabase

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `ozlmduqomteomyirbwgc`
3. Go to **Settings** → **Edge Functions** → **Manage secrets**
4. Add new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_api_key_here` (paste the key from Step 2)
5. Click **Save**

### Step 5: Deploy Edge Function to Supabase

Open PowerShell in your project folder and run:

```powershell
# Login to Supabase (if not already logged in)
npx supabase login

# Link your project
npx supabase link --project-ref ozlmduqomteomyirbwgc

# Deploy the edge function
npx supabase functions deploy send-appointment-notification
```

### Step 6: Update Email Domain in Code (If Using Custom Domain)

If you completed Option B in Step 3:

1. Open: `supabase/functions/send-appointment-notification/index.ts`
2. Find line: `from: 'MindSense Alerts <alerts@mindsense.app>'`
3. Change `mindsense.app` to YOUR domain
4. Redeploy: `npx supabase functions deploy send-appointment-notification`

## ✅ Test Real Email Sending

1. Start your local dev server:
   ```powershell
   npm run dev
   ```

2. Open: http://localhost:8082

3. Navigate to Dashboard → **Professional Support** card

4. Click **"Request Appointment"**

5. Give consent and click **"Send Request"**

6. Check your console - should see: `✅ Email sent successfully`

7. **CHECK DR. PRAKHAR SINGH'S EMAIL**: ghostfather1234@gmail.com
   - Look in inbox for beautiful HTML email with:
     - Patient risk summary
     - Consecutive high-risk days count
     - Accept/Decline buttons
     - Professional formatting

## 🎨 Email Features

Your emails include:
- ✅ Professional HTML template with gradient header
- ✅ Patient risk level and trend analysis
- ✅ HIPAA compliance notice
- ✅ Accept/Decline action buttons
- ✅ Plain text fallback for email clients without HTML
- ✅ Responsive design for mobile devices

## 🔧 Troubleshooting

### "Failed to send email notification"
- **Check**: Is `RESEND_API_KEY` set in Supabase secrets?
- **Check**: Did you deploy the edge function?
- **Fix**: Run `npx supabase functions deploy send-appointment-notification`

### "Email not received"
- **Check**: Spam folder in ghostfather1234@gmail.com
- **Check**: Resend dashboard → Emails → Check delivery status
- **Check**: If using custom domain, verify DNS records are correct

### "Function not found"
- **Fix**: Link project: `npx supabase link --project-ref ozlmduqomteomyirbwgc`
- **Fix**: Deploy function: `npx supabase functions deploy send-appointment-notification`

## 📊 Monitor Email Delivery

1. Go to **Resend Dashboard**: https://resend.com/emails
2. See all sent emails with:
   - Delivery status (sent/delivered/bounced)
   - Open rates
   - Click tracking
   - Error logs

## 💰 Pricing (You're on FREE Tier)

- **FREE**: 3,000 emails/month, 100 emails/day
- **Pro**: $20/month for 50,000 emails (upgrade later if needed)

With 3,000 free emails, you can handle:
- ~100 appointments/day
- Perfect for testing and early production

## 🔐 Security Notes

- ✅ API key stored securely in Supabase (not in code)
- ✅ CORS headers configured for your domain only
- ✅ Edge function validates all required fields
- ✅ Patient privacy: Only summary data shared (no raw recordings)

## 📞 Next Steps (Optional Enhancements)

Want to add SMS notifications too?

I can integrate **Twilio** to send SMS to: +91-8755925152

Let me know if you want:
1. SMS notifications when appointment requested
2. SMS reminders for confirmed appointments
3. Two-way SMS communication with doctor

---

## ✅ Quick Command Reference

```powershell
# Deploy edge function
npx supabase functions deploy send-appointment-notification

# Check function logs
npx supabase functions logs send-appointment-notification

# Test function locally (before deploying)
npx supabase functions serve send-appointment-notification

# Update secrets
# Go to Supabase Dashboard → Settings → Edge Functions → Manage secrets
```

---

**Ready to test?** Follow Step 5 to deploy, then test on localhost:8082! 🎉
