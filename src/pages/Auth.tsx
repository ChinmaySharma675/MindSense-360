import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';
import { Brain, Heart, Activity, Shield, Lock, Loader2 } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const validationData = isLogin 
      ? { email, password }
      : { email, password, name };
    
    const result = authSchema.safeParse(validationData);
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; name?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'name') fieldErrors.name = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Login failed',
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.' 
              : error.message,
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      } else {
        // Sign up with Supabase directly to get user data
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'This email is already registered. Try logging in instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Signup failed',
              description: error.message,
            });
          }
        } else {
          // Create profile with name
          if (data.user && name.trim()) {
            try {
              await supabase.from('profiles').upsert({
                user_id: data.user.id,
                display_name: name.trim(),
              });
            } catch (profileError) {
              console.error('Error creating profile:', profileError);
            }
          }
          
          toast({
            title: 'Account created!',
            description: 'Please check your email to confirm your account.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/fitness.activity.read',
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Google Sign-in failed',
          description: error.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to sign in with Google',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <Brain className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gradient-calm">
      {/* Logo and branding */}
      <div className="mb-8 text-center animate-slide-in">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">MindSense</h1>
        </div>
        <p className="text-muted-foreground">
          Your mental wellness companion
        </p>
      </div>

      {/* Feature highlights */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <span>Real-time monitoring</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span>AI-powered insights</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Privacy-first</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <span>No data selling</span>
        </div>
      </div>

      {/* Auth card */}
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center">
          <CardTitle>{isLogin ? 'Welcome back' : 'Create account'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to continue your wellness journey' 
              : 'Start tracking your mental well-being today'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Please wait...' 
                : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-in */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">
              🏃 Connect Google Fit for automatic health tracking
            </p>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setName(''); // Clear name when switching
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <div className="mt-6 max-w-md">
        <MedicalDisclaimer variant="inline" />
      </div>

      {/* Privacy note */}
      <p className="mt-4 text-xs text-muted-foreground text-center max-w-sm">
        By continuing, you agree to our privacy-first approach. 
        We never store raw voice data and all analysis is anonymized.
        You'll review our full privacy practices after signing in.
      </p>
    </div>
  );
}