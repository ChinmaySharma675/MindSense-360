import { useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useConsentStatus } from '@/hooks/useConsentStatus';
import { useRealtimeScores } from '@/hooks/useRealtimeScores';
import { useScoreHistory } from '@/hooks/useScoreHistory';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BehavioralForm } from '@/components/BehavioralForm';
import { WearableForm } from '@/components/WearableForm';
import { GoogleFitSync } from '@/components/GoogleFitSync';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ScoreCard } from '@/components/ScoreCard';
import { RiskCard } from '@/components/RiskCard';
import { TrendChart } from '@/components/TrendChart';
import { RiskOverTimeChart } from '@/components/RiskOverTimeChart';
import { BehaviorVsRiskChart } from '@/components/BehaviorVsRiskChart';
import { AlertsNudges } from '@/components/AlertsNudges';
import { SessionIndicator } from '@/components/SessionIndicator';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { PsychiatristCard } from '@/components/PsychiatristCard';
import { ConsentDialog } from '@/components/ConsentDialog';
import { PrivacyInfo } from '@/components/PrivacyInfo';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { Brain, Activity, Mic, Heart, LogOut, RefreshCw, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdminRole(user?.id);
  const { hasConsented, isLoading: consentLoading, acceptConsent, revokeConsent } = useConsentStatus(user?.id);
  const navigate = useNavigate();

  const { history, isLoading: historyLoading, fetchHistory } = useScoreHistory(user?.id);
  const { data: analyticsData, isLoading: analyticsLoading, fetchAnalytics } = useAnalytics(user?.id);

  // Real-time scores subscription
  const { scores, isLoading: loadingScores, lastUpdate, isConnected, refresh } = useRealtimeScores({
    userId: user?.id,
    onScoreUpdate: () => {
      // Refresh history and analytics when any score updates
      fetchHistory();
      fetchAnalytics();
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Initial history fetch
    if (user) {
      fetchHistory();
      fetchAnalytics();
    }
  }, [user, fetchHistory, fetchAnalytics]);

  const handleSignOut = async () => {
    revokeConsent();
    await signOut();
    navigate('/auth');
  };

  const handleConsentDecline = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDataSubmit = useCallback(async () => {
    // Scores update automatically via realtime subscription
    // Just refresh history for the trend chart
    await fetchHistory();
  }, [fetchHistory]);

  if (loading || consentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <Brain className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Show consent dialog if user hasn't consented yet
  const showConsentDialog = hasConsented === false;

  return (
    <div className="min-h-screen bg-background">
      {/* Consent Dialog */}
      <ConsentDialog 
        open={showConsentDialog}
        onAccept={acceptConsent}
        onDecline={handleConsentDecline}
      />

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MindSense</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Session & Connection Status */}
            <SessionIndicator isConnected={isConnected} />
            
            {lastUpdate && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="text-primary border-primary/30">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <ProfileDropdown user={user} onSignOut={handleSignOut} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Log your daily data and track your mental wellness.
            <span className="text-xs ml-2 text-success">
              {isConnected ? '🔴 Live updates enabled' : '📡 Auto-refreshes every 30s'}
            </span>
          </p>
        </div>

        {/* Risk Assessment Card */}
        <div className="mb-8">
          <RiskCard />
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ScoreCard
            title="Behavioral"
            score={scores.behavior}
            icon={<Activity className="h-5 w-5 text-primary" />}
            description="Sleep, screen time & activity"
          />
          <ScoreCard
            title="Voice"
            score={scores.voice}
            icon={<Mic className="h-5 w-5 text-primary" />}
            description="Voice stress analysis"
          />
          <ScoreCard
            title="Wearable"
            score={scores.wearable}
            icon={<Heart className="h-5 w-5 text-primary" />}
            description="Heart rate & steps"
          />
        </div>

        {/* Alerts & Nudges */}
        {analyticsData.length > 0 && (
          <div className="mb-8">
            <AlertsNudges recentData={analyticsData} />
          </div>
        )}

        {/* Weekly Trend Chart */}
        <div className="mb-8">
          <TrendChart data={history} isLoading={historyLoading} />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RiskOverTimeChart data={analyticsData} isLoading={analyticsLoading} />
          <BehaviorVsRiskChart data={analyticsData} isLoading={analyticsLoading} />
        </div>

        {/* Psychiatrist Support */}
        <div className="mb-8">
          <PsychiatristCard 
            userId={user.id} 
            currentRisk={(scores.behavior + scores.voice + scores.wearable) / 3}
          />
        </div>

        {/* Data input tabs */}
        <Tabs defaultValue="behavioral" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="wearable">Wearable</TabsTrigger>
          </TabsList>
          
          <TabsContent value="behavioral">
            <BehavioralForm 
              onSuccess={() => handleDataSubmit()} 
            />
          </TabsContent>
          
          <TabsContent value="voice">
            <VoiceRecorder 
              onSuccess={() => handleDataSubmit()} 
            />
          </TabsContent>
          
          <TabsContent value="wearable" className="space-y-4">
            {/* Google Fit Integration */}
            <GoogleFitSync 
              onDataFetched={() => handleDataSubmit()}
            />
            
            {/* Manual Wearable Form */}
            <WearableForm 
              onSuccess={() => handleDataSubmit()} 
            />
          </TabsContent>
        </Tabs>

        {/* Privacy Info Section */}
        <div className="mt-8 max-w-md mx-auto">
          <PrivacyInfo />
        </div>

        {/* Medical Disclaimer Footer */}
        <div className="mt-6 max-w-2xl mx-auto">
          <MedicalDisclaimer variant="compact" />
        </div>
      </main>
    </div>
  );
}
