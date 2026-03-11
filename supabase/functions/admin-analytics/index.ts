import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to check admin status
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
    }

    const isAdmin = !!roleData;
    console.log(`User ${user.id} admin status: ${isAdmin}`);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch aggregate analytics using service role (bypasses RLS)
    console.log('Fetching analytics data...');

    // Get total users count
    const { count: totalUsers } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get risk distribution
    const { data: riskResults } = await adminClient
      .from('risk_results')
      .select('risk_level, calculated_at, user_id');

    // Calculate risk distribution (latest per user)
    const latestRiskByUser = new Map<string, { risk_level: string; calculated_at: string }>();
    riskResults?.forEach((r) => {
      const existing = latestRiskByUser.get(r.user_id);
      if (!existing || new Date(r.calculated_at) > new Date(existing.calculated_at)) {
        latestRiskByUser.set(r.user_id, r);
      }
    });

    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };
    latestRiskByUser.forEach((r) => {
      riskDistribution[r.risk_level as keyof typeof riskDistribution]++;
    });

    // Get weekly risk trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: weeklyRisks } = await adminClient
      .from('risk_results')
      .select('risk_level, calculated_at')
      .gte('calculated_at', sevenDaysAgo.toISOString())
      .order('calculated_at', { ascending: true });

    // Group by day
    const dailyRiskCounts: Record<string, { LOW: number; MEDIUM: number; HIGH: number; total: number }> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      dailyRiskCounts[dateStr] = { LOW: 0, MEDIUM: 0, HIGH: 0, total: 0 };
    }

    weeklyRisks?.forEach((r) => {
      const dateStr = new Date(r.calculated_at).toISOString().split('T')[0];
      if (dailyRiskCounts[dateStr]) {
        dailyRiskCounts[dateStr][r.risk_level as 'LOW' | 'MEDIUM' | 'HIGH']++;
        dailyRiskCounts[dateStr].total++;
      }
    });

    const weeklyTrend = Object.entries(dailyRiskCounts).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    // Get data submission stats
    const { count: behaviorCount } = await adminClient
      .from('behavior_data')
      .select('*', { count: 'exact', head: true });

    const { count: voiceCount } = await adminClient
      .from('voice_scores')
      .select('*', { count: 'exact', head: true });

    const { count: wearableCount } = await adminClient
      .from('wearable_data')
      .select('*', { count: 'exact', head: true });

    // Get active users (submitted data in last 7 days)
    const { data: recentBehavior } = await adminClient
      .from('behavior_data')
      .select('user_id')
      .gte('recorded_at', sevenDaysAgo.toISOString());

    const { data: recentVoice } = await adminClient
      .from('voice_scores')
      .select('user_id')
      .gte('recorded_at', sevenDaysAgo.toISOString());

    const { data: recentWearable } = await adminClient
      .from('wearable_data')
      .select('user_id')
      .gte('recorded_at', sevenDaysAgo.toISOString());

    const activeUserIds = new Set<string>();
    recentBehavior?.forEach((d) => activeUserIds.add(d.user_id));
    recentVoice?.forEach((d) => activeUserIds.add(d.user_id));
    recentWearable?.forEach((d) => activeUserIds.add(d.user_id));

    const analytics = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUserIds.size,
      riskDistribution,
      weeklyTrend,
      dataSubmissions: {
        behavior: behaviorCount || 0,
        voice: voiceCount || 0,
        wearable: wearableCount || 0,
        total: (behaviorCount || 0) + (voiceCount || 0) + (wearableCount || 0),
      },
      usersWithRisk: latestRiskByUser.size,
    };

    console.log('Analytics computed successfully');

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
