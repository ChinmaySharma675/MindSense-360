import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  User
} from 'lucide-react';

interface AppointmentRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  risk_level: string;
  consecutive_days: number;
  created_at: string;
  updated_at: string;
  doctor_notes: string | null;
  appointment_date: string | null;
  user_email?: string;
}

export function AppointmentsManager() {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // Fetch appointments first
      const { data: appointmentsData, error: appointmentsError } = await (supabase as any)
        .from('appointment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (appointmentsError) {
        console.error('Supabase error:', appointmentsError);
        throw appointmentsError;
      }

      // Get user emails from auth.users via RPC or use user_id
      const appointmentsWithEmails = appointmentsData?.map((apt: any) => ({
        ...apt,
        user_email: `User ${apt.user_id.slice(0, 8)}...` // Placeholder for now
      })) || [];

      console.log('Appointments fetched:', appointmentsWithEmails);
      setAppointments(appointmentsWithEmails as AppointmentRequest[]);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string, 
    newStatus: 'accepted' | 'rejected'
  ) => {
    try {
      const { error } = await (supabase as any)
        .from('appointment_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: newStatus === 'accepted' ? '✅ Accepted' : '❌ Rejected',
        description: `Appointment request has been ${newStatus}`,
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> High Risk</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-orange-500"><TrendingUp className="h-3 w-3 mr-1" /> Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Requests
            </CardTitle>
            <CardDescription>
              Manage patient appointment requests
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No appointment requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left Side - Patient Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getRiskBadge(appointment.risk_level)}
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{appointment.user_email || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Risk Details */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-xs text-muted-foreground">Risk Level</div>
                          <div className="font-semibold text-lg">{appointment.risk_level}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Consecutive Days</div>
                          <div className="font-semibold text-lg">{appointment.consecutive_days} days</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Requested</div>
                          <div className="text-sm">
                            {new Date(appointment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Patient ID</div>
                          <div className="text-xs font-mono">
                            {appointment.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="flex md:flex-col gap-2">
                      {appointment.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                            onClick={() => updateAppointmentStatus(appointment.id, 'accepted')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 md:flex-none"
                            onClick={() => updateAppointmentStatus(appointment.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {appointment.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'} on{' '}
                          {new Date(appointment.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
