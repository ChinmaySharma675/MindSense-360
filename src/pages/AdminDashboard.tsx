import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Users, Activity, TrendingUp, BarChart3, 
  ArrowLeft, RefreshCw, Shield, AlertTriangle 
} from 'lucide-react';
import { RiskDistributionChart } from '@/components/admin/RiskDistributionChart';
import { WeeklyTrendChart } from '@/components/admin/WeeklyTrendChart';
import { StatsCard } from '@/components/admin/StatsCard';
import { AppointmentsManager } from '@/components/admin/AppointmentsManager';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  weeklyTrend: Array<{
    date: string;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    total: number;
  }>;
  dataSubmissions: {
    behavior: number;
    voice: number;
    wearable: number;
    total: number;
  };
  usersWithRisk: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics');
      
      if (error) throw error;
      
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to load analytics',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roleLoading && user && !isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You need admin privileges to access this page',
      });
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchAnalytics();
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <Brain className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Admin Analytics</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {error ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-4 py-8">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">Failed to load analytics</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchAnalytics} className="ml-auto">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="Total Users"
                value={analytics?.totalUsers ?? 0}
                icon={<Users className="h-5 w-5" />}
                isLoading={isLoading}
              />
              <StatsCard
                title="Active Users (7d)"
                value={analytics?.activeUsers ?? 0}
                icon={<Activity className="h-5 w-5" />}
                description="Users with data in last 7 days"
                isLoading={isLoading}
              />
              <StatsCard
                title="Risk Assessments"
                value={analytics?.usersWithRisk ?? 0}
                icon={<TrendingUp className="h-5 w-5" />}
                description="Users with calculated risk"
                isLoading={isLoading}
              />
              <StatsCard
                title="Total Submissions"
                value={analytics?.dataSubmissions?.total ?? 0}
                icon={<BarChart3 className="h-5 w-5" />}
                description="All data entries"
                isLoading={isLoading}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RiskDistributionChart 
                data={analytics?.riskDistribution} 
                isLoading={isLoading} 
              />
              <WeeklyTrendChart 
                data={analytics?.weeklyTrend} 
                isLoading={isLoading} 
              />
            </div>

            {/* Appointment Management */}
            <div className="mb-8">
              <AppointmentsManager />
            </div>

            {/* Data Submissions Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Data Submissions Breakdown
                </CardTitle>
                <CardDescription>
                  Total submissions by data type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-24 animate-pulse bg-muted rounded" />
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-accent/50">
                      <div className="text-3xl font-bold text-primary">
                        {analytics?.dataSubmissions?.behavior ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Behavioral</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-accent/50">
                      <div className="text-3xl font-bold text-primary">
                        {analytics?.dataSubmissions?.voice ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Voice</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-accent/50">
                      <div className="text-3xl font-bold text-primary">
                        {analytics?.dataSubmissions?.wearable ?? 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Wearable</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
