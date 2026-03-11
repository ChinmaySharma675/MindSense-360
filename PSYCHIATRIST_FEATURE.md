# Psychiatrist Support Feature - Setup Guide

## 🎯 Overview
The Psychiatrist Support system monitors users for persistent high-risk mental health patterns and facilitates professional intervention through appointment requests.

## ⚠️ How It Works

### 1. **3-Day Persistent Risk Escalation**
- System monitors user's combined risk score daily
- **HIGH RISK** = Average of (Behavioral + Voice + Wearable scores) ≥ 60%
- If user stays in HIGH risk for **3+ consecutive days**:
  - 🚨 Alert is triggered
  - User sees escalation warning on dashboard
  - Professional support is strongly recommended

### 2. **Appointment Request System**
When high risk is detected, users can:
1. Click "Request Appointment" button
2. Give consent to share wellness summary
3. System sends notification to assigned psychiatrist
4. Psychiatrist can accept/reject the request

### 3. **Data Sharing (with Consent)**
**What IS shared:**
- ✅ Current risk level (LOW/MEDIUM/HIGH)
- ✅ Number of consecutive high-risk days
- ✅ Summary scores (behavioral, voice, wearable averages)
- ✅ Trend direction (improving/worsening)

**What is NOT shared:**
- ❌ Raw voice recordings
- ❌ Detailed behavioral logs
- ❌ Personal identifiable information beyond contact preference

---

## 🔧 Setup Instructions

### Step 1: Create Database Table

Run this in your Supabase SQL editor:

```sql
-- See: supabase/migrations/20260209000000_create_appointments.sql
-- Or run this directly:

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  doctor_notes TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON public.appointment_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments"
  ON public.appointment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.appointment_requests FOR UPDATE USING (auth.uid() = user_id);
```

### Step 2: Configure Doctor Information

Edit `src/components/PsychiatristCard.tsx` line 25-30:

```typescript
const TEST_DOCTOR = {
  name: 'Dr. Prakhar Singh',          // Your name
  phone: '+91-XXXXXXXXXX',            // Your phone number
  email: 'pratapprakhar070@gmail.com', // Your email
  specialization: 'Clinical Psychologist',
};
```

### Step 3: Test the Feature

1. **Trigger High Risk:**
   - Log behavioral, voice, and wearable data with poor scores
   - Do this for 3 consecutive days
   - Combined average should be ≥ 60%

2. **Request Appointment:**
   - After 3 days, alert appears on dashboard
   - Click "Request Appointment"
   - Give consent
   - Click "Send Request"

3. **Check Notification:**
   - Open browser console (F12)
   - Look for "📧 DOCTOR NOTIFICATION" log
   - Contains email details that would be sent

---

## 📊 Database Schema

```
appointment_requests
├── id (UUID, primary key)
├── user_id (UUID, references auth.users)
├── status (TEXT: 'pending' | 'accepted' | 'rejected')
├── risk_level (TEXT: 'LOW' | 'MEDIUM' | 'HIGH')
├── consecutive_days (INTEGER)
├── doctor_notes (TEXT, nullable)
├── appointment_date (TIMESTAMP, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🔮 Future Enhancements

### Production Integration:
1. **Email Service:**
   - Integrate SendGrid, AWS SES, or similar
   - Replace console.log with actual email sending
   - Add email templates

2. **SMS Notifications:**
   - Add Twilio integration
   - Send SMS alerts to doctor
   - Appointment reminders

3. **Doctor Portal:**
   - Separate dashboard for psychiatrists
   - View all pending requests
   - Accept/reject appointments
   - Schedule appointment dates
   - Add notes

4. **Multi-Doctor Support:**
   - Database of psychiatrists
   - Match based on specialization
   - Availability calendar
   - Smart assignment algorithm

5. **HIPAA Compliance:**
   - End-to-end encryption
   - Audit logs
   - Secure data transmission
   - Patient consent management

---

## 🧪 Testing Checklist

- [ ] Database table created successfully
- [ ] Doctor info updated with your details
- [ ] 3-day high-risk pattern triggers alert
- [ ] Appointment request creates DB record
- [ ] Console shows doctor notification email
- [ ] Status updates correctly (pending/accepted/rejected)
- [ ] Consent checkbox works
- [ ] User can't request if already pending
- [ ] UI shows correct status badges

---

## 📧 Sample Doctor Email

```
Subject: New Appointment Request - MindSense

Dear Dr. Prakhar Singh,

You have a new appointment request from a patient on MindSense.

Patient Summary:
- Current Risk Level: HIGH
- Consecutive High-Risk Days: 3
- Request Date: 2/9/2026

Please review and respond to this request.

Actions:
✅ Accept Appointment
❌ Reject Request

---
This is an automated message from MindSense.
```

---

## 🎨 UI Components

1. **PsychiatristCard** - Main component on dashboard
2. **Risk Alert Badge** - Shows when 3+ high-risk days detected
3. **Doctor Info Panel** - Displays assigned psychiatrist details
4. **Appointment Dialog** - Request form with consent checkbox
5. **Status Indicator** - Shows pending/accepted/rejected state

---

## 🚀 Ready to Deploy!

Once tested locally:
1. Commit changes to Git
2. Push to GitHub
3. Click "Publish" in Lovable
4. Run SQL migration in Supabase production
5. Update doctor info for production use

**For real deployment, integrate with email/SMS services!**
