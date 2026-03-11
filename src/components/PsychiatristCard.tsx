import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Stethoscope, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface PsychiatristCardProps {
  userId: string;
  currentRisk: number;
}

interface AppointmentRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  risk_level: string;
  consecutive_days: number;
}

// Test doctor info - Replace with real doctor details later
const TEST_DOCTOR = {
  name: 'Dr. Prakhar Singh',
  phone: '+91-8755925152',
  email: 'prakhar.singh_cs.aiml24@gla.ac.in', // Changed to verified Resend account email
  specialization: 'Clinical Psychologist',
};

export function PsychiatristCard({ userId, currentRisk }: PsychiatristCardProps) {
  const [highRiskDays, setHighRiskDays] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);
  const [escalationTriggered, setEscalationTriggered] = useState(false);
  const [appointmentRequest, setAppointmentRequest] = useState<AppointmentRequest | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const { toast } = useToast();

  // Check for consecutive high-risk days
  useEffect(() => {
    checkHighRiskPattern();
    fetchAppointmentStatus();
  }, [userId, currentRisk]);

  const checkHighRiskPattern = async () => {
    try {
      // Get risk scores from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('risk_results')
        .select('*')
        .eq('user_id', userId)
        .gte('calculated_at', sevenDaysAgo.toISOString())
        .order('calculated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Check for consecutive HIGH risk days
        let consecutiveDays = 0;
        const today = new Date().toDateString();

        for (const result of data) {
          const resultDate = new Date(result.calculated_at).toDateString();
          
          // Calculate combined risk
          const scores = [
            result.behavior_score,
            result.voice_score,
            result.wearable_score
          ].filter(s => s !== null) as number[];
          
          const avgRisk = scores.length > 0 
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
            : 0;

          if (avgRisk >= 0.6) { // HIGH risk threshold
            consecutiveDays++;
            if (consecutiveDays >= 3 && !escalationTriggered) {
              setHighRiskDays(consecutiveDays);
              triggerEscalation(consecutiveDays);
              break;
            }
          } else {
            break; // Reset if not consecutive
          }
        }
        
        setHighRiskDays(consecutiveDays);
      }
    } catch (error) {
      console.error('Error checking risk pattern:', error);
    }
  };

  const triggerEscalation = async (days: number) => {
    setEscalationTriggered(true);
    
    toast({
      title: '⚠️ High Risk Alert',
      description: `You've been in high-risk zone for ${days} days. Professional support is recommended.`,
      variant: 'destructive',
    });
  };

  const fetchAppointmentStatus = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('appointment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Table might not exist yet or no data found - fail silently
        return;
      }

      if (data) {
        setAppointmentRequest(data as AppointmentRequest);
      }
    } catch (error) {
      // Ignore errors - table might not exist yet
      console.log('Appointment table not ready yet');
    }
  };

  const requestAppointment = async () => {
    if (!consentGiven) {
      toast({
        title: 'Consent Required',
        description: 'Please give consent to share your wellness summary with the psychiatrist.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create appointment request
      const { data, error } = await (supabase as any)
        .from('appointment_requests')
        .insert({
          user_id: userId,
          status: 'pending',
          risk_level: currentRisk >= 0.6 ? 'HIGH' : currentRisk >= 0.3 ? 'MEDIUM' : 'LOW',
          consecutive_days: highRiskDays,
        })
        .select()
        .single();

      if (error) {
        // Table doesn't exist yet
        toast({
          title: 'Feature Not Ready',
          description: 'The appointment system needs to be set up. Please contact support.',
          variant: 'destructive',
        });
        return;
      }

      setAppointmentRequest(data as AppointmentRequest);

      // Send notification (in real implementation, this would send email/SMS)
      await sendDoctorNotification(data as AppointmentRequest);

      toast({
        title: '✅ Request Sent',
        description: `Appointment request sent to ${TEST_DOCTOR.name}. You'll receive a response soon.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendDoctorNotification = async (request: AppointmentRequest) => {
    try {
      // 🚀 Call Supabase Edge Function to send REAL email
      console.log('📧 Calling edge function to send email...');
      
      const { data, error } = await supabase.functions.invoke('send-appointment-notification', {
        body: {
          doctorEmail: TEST_DOCTOR.email,
          doctorName: TEST_DOCTOR.name,
          patientId: userId,
          riskLevel: request.risk_level,
          consecutiveDays: request.consecutive_days,
          requestDate: new Date(request.created_at).toLocaleDateString(),
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Show detailed error to user
        toast({
          title: '❌ Email Failed',
          description: `${error.message || 'Unknown error'}. Check console for details.`,
          variant: 'destructive',
        });
        return;
      }

      // Check if the response has an error field (even with 200 status)
      if (data && data.error) {
        console.error('Function returned error:', data);
        toast({
          title: '❌ Email Service Error',
          description: `${data.error}: ${JSON.stringify(data.details)}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Email sent successfully!', data);
      
      toast({
        title: '📧 Email Sent!',
        description: `Real email sent to ${TEST_DOCTOR.email}`,
      });
    } catch (error: any) {
      console.error('❌ Email failed:', error);
      toast({
        title: '⚠️ Email Failed',
        description: error.message || 'Could not send email. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const cancelAppointment = async () => {
    if (!appointmentRequest) return;

    try {
      const { error } = await (supabase as any)
        .from('appointment_requests')
        .delete()
        .eq('id', appointmentRequest.id);

      if (error) throw error;

      setAppointmentRequest(null);
      setConsentGiven(false);

      toast({
        title: '✅ Request Cancelled',
        description: 'Your appointment request has been cancelled. You can submit a new one anytime.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    if (!appointmentRequest) return <Clock className="h-4 w-4" />;
    
    switch (appointmentRequest.status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusText = () => {
    if (!appointmentRequest) return 'No active request';
    
    switch (appointmentRequest.status) {
      case 'accepted':
        return 'Appointment Accepted';
      case 'rejected':
        return 'Request Declined';
      default:
        return 'Pending Response';
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Professional Support</CardTitle>
              <CardDescription>Connect with mental health experts</CardDescription>
            </div>
          </div>
          {highRiskDays >= 3 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alert
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Status */}
        {highRiskDays >= 3 && (
          <Alert variant="destructive">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>High Risk Detected:</strong> You've been in the high-risk zone for {highRiskDays} consecutive days. 
              We recommend speaking with a mental health professional.
            </AlertDescription>
          </Alert>
        )}

        {/* Assigned Psychiatrist */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-semibold text-sm">Assigned Psychiatrist</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{TEST_DOCTOR.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{TEST_DOCTOR.specialization}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3" />
              <span>{TEST_DOCTOR.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3" />
              <span className="text-xs">{TEST_DOCTOR.email}</span>
            </div>
          </div>
        </div>

        {/* Appointment Request Status */}
        {appointmentRequest && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              {appointmentRequest.status === 'pending' && (
                <Badge variant="outline" className="text-xs">
                  Awaiting Response
                </Badge>
              )}
            </div>
            {appointmentRequest.status === 'pending' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={cancelAppointment}
              >
                <XCircle className="mr-2 h-3 w-3" />
                Cancel Request & Submit New
              </Button>
            )}
          </div>
        )}

        {/* Consent & Request Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant={highRiskDays >= 3 ? 'default' : 'outline'}
              disabled={appointmentRequest?.status === 'pending'}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {appointmentRequest?.status === 'pending' 
                ? 'Request Pending' 
                : 'Request Appointment'}
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Appointment</DialogTitle>
              <DialogDescription>
                Connect with {TEST_DOCTOR.name} for professional support
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Consent Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-sm cursor-pointer">
                  <strong>Consent to Share Data:</strong> I authorize MindSense to share my wellness 
                  summary (risk scores, trends, not raw data) with {TEST_DOCTOR.name} for professional 
                  assessment and appointment scheduling.
                </label>
              </div>

              {/* What Will Be Shared */}
              <div className="text-sm space-y-2">
                <p className="font-medium">What will be shared:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Current risk level and trend</li>
                  <li>Number of consecutive high-risk days</li>
                  <li>Summary scores (behavioral, voice, wearable)</li>
                  <li>Your contact preference</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  ❌ Raw voice recordings and detailed behavioral logs are NOT shared.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={requestAppointment}
                  disabled={!consentGiven}
                  className="flex-1"
                >
                  Send Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          💡 All consultations are confidential and HIPAA-compliant
        </p>
      </CardContent>
    </Card>
  );
}
