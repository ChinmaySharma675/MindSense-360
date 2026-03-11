// 🧪 TEMPORARY TEST FILE - For localhost testing only
// Simulates email sending by logging to console
// Real emails will work after deploying edge function

export const sendTestEmail = async (
  doctorEmail: string,
  doctorName: string,
  patientId: string,
  riskLevel: string,
  consecutiveDays: number
) => {
  // TEMPORARY: Just log the email details to console
  // This helps you verify the data is correct before sending real emails
  
  console.log('📧 ========== EMAIL WOULD BE SENT ==========');
  console.log('To:', doctorEmail);
  console.log('Subject: 🚨 New Appointment Request - MindSense');
  console.log('Doctor:', doctorName);
  console.log('Patient ID:', patientId.substring(0, 8) + '...');
  console.log('Risk Level:', riskLevel);
  console.log('Consecutive Days:', consecutiveDays);
  console.log('==========================================');
  
  // Simulate successful send
  return { 
    success: true, 
    data: { 
      message: 'Email logged to console (real sending requires edge function deployment)' 
    } 
  };
};
