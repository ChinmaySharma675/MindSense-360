// @ts-nocheck - Deno edge function, not TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentNotification {
  doctorEmail: string;
  doctorName: string;
  patientId: string;
  riskLevel: string;
  consecutiveDays: number;
  requestDate: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Starting email function...');
    console.log('API Key present:', !!RESEND_API_KEY);
    
    const { 
      doctorEmail, 
      doctorName, 
      patientId, 
      riskLevel, 
      consecutiveDays, 
      requestDate 
    }: AppointmentNotification = await req.json();

    console.log('Received request:', { doctorEmail, doctorName, riskLevel });

    // Validate required fields
    if (!doctorEmail || !doctorName || !riskLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check if API key is available
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling Resend API...');

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MindSense <onboarding@resend.dev>',
        to: [doctorEmail],
        subject: '🚨 New Appointment Request - MindSense',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .alert-box { background: #fee; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .info-row { display: flex; justify-content: space-between; padding: 12px; background: white; margin: 8px 0; border-radius: 4px; }
                .info-label { font-weight: bold; color: #666; }
                .info-value { color: #333; }
                .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; }
                .btn-accept { background: #48bb78; color: white; }
                .btn-reject { background: #f56565; color: white; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🏥 MindSense</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Support Platform</p>
                </div>
                
                <div class="content">
                  <h2>Hello Dr. ${doctorName},</h2>
                  
                  <p>You have received a new appointment request from a patient on the MindSense platform.</p>
                  
                  <div class="alert-box">
                    <strong>⚠️ High Priority:</strong> This patient has been in a high-risk zone for ${consecutiveDays} consecutive days.
                  </div>
                  
                  <h3>Patient Summary</h3>
                  
                  <div class="info-row">
                    <span class="info-label">🎯 Current Risk Level:</span>
                    <span class="info-value"><strong>${riskLevel}</strong></span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">📅 Consecutive High-Risk Days:</span>
                    <span class="info-value">${consecutiveDays} days</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">📆 Request Date:</span>
                    <span class="info-value">${requestDate}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="info-label">👤 Patient ID:</span>
                    <span class="info-value">${patientId.substring(0, 8)}...</span>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://spark-hug-app.lovable.app/admin" class="button btn-accept">
                      ✅ Accept Appointment
                    </a>
                    <a href="https://spark-hug-app.lovable.app/admin" class="button btn-reject">
                      ❌ Decline Request
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  
                  <h3>📊 What's Included</h3>
                  <ul>
                    <li>Risk trend analysis (behavioral, voice, wearable data)</li>
                    <li>Pattern recognition for consecutive high-risk days</li>
                    <li>Patient consent for data sharing</li>
                    <li>HIPAA-compliant communication</li>
                  </ul>
                  
                  <p style="font-size: 12px; color: #666; margin-top: 20px;">
                    <strong>Privacy Note:</strong> Raw voice recordings and detailed behavioral logs are NOT shared. 
                    Only summary scores and risk calculations are provided.
                  </p>
                </div>
                
                <div class="footer">
                  <p>This is an automated notification from MindSense</p>
                  <p>© ${new Date().getFullYear()} MindSense - Mental Wellness Platform</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
Dear Dr. ${doctorName},

You have a new appointment request from a patient on MindSense.

PATIENT SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Current Risk Level: ${riskLevel}
• Consecutive High-Risk Days: ${consecutiveDays}
• Request Date: ${requestDate}
• Patient ID: ${patientId.substring(0, 8)}...

⚠️ HIGH PRIORITY: This patient has been in a high-risk zone for ${consecutiveDays} consecutive days.

ACTIONS REQUIRED:
✅ Accept Appointment - Visit dashboard to confirm
❌ Decline Request - If unavailable

Access your dashboard: https://spark-hug-app.lovable.app/admin

PRIVACY COMPLIANCE:
Only summary scores and risk calculations are shared. Raw voice recordings and detailed behavioral logs are NOT included.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message from MindSense
© ${new Date().getFullYear()} MindSense - Mental Wellness Platform
        `,
      }),
    });

    const emailData = await emailResponse.json();
    
    console.log('Resend API Response Status:', emailResponse.status);
    console.log('Resend API Response Data:', JSON.stringify(emailData, null, 2));

    if (!emailResponse.ok) {
      console.error('❌ Resend API Error - Status:', emailResponse.status);
      console.error('❌ Resend API Error - Body:', JSON.stringify(emailData, null, 2));
      
      // Return detailed error to client
      return new Response(
        JSON.stringify({ 
          error: 'Resend API rejected email', 
          resendError: emailData.message || emailData.error || 'Unknown error',
          resendDetails: emailData,
          status: emailResponse.status,
          suggestion: 'Check if recipient email is valid and Resend account is verified'
        }),
        { 
          status: 400,  // Changed from 500 to 400 so error details reach client
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Email sent successfully!', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        emailId: emailData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-appointment-notification:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
