import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { emailSchema, passwordSchema, displayNameSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import latenLogo from '@/assets/laten-logo.png';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/explore');
    }
  }, [user, navigate]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; displayName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = displayNameSchema.safeParse(displayName);
      if (!nameResult.success) {
        newErrors.displayName = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/explore');
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Try logging in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Check your email to verify.');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Check if we're in a native Capacitor environment
      const isNative = window.hasOwnProperty('Capacitor') && (window as any).Capacitor?.isNativePlatform?.();
      
      // For web, redirect back to current origin after auth
      // For native, use custom scheme
      const redirectUrl = isNative 
        ? 'laten://auth/callback' 
        : `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        console.error('Google Sign-In error:', error);
        if (error.message.includes('provider is not enabled')) {
          toast.error('Google Sign-In is not configured. Please use email/password.');
        } else if (error.message.includes('popup')) {
          toast.error('Popup was blocked. Please allow popups for this site.');
        } else {
          toast.error('Unable to sign in with Google. Please try another method.');
        }
        setLoading(false);
        return;
      }
      
      // For native apps, open the OAuth URL in the system browser
      if (isNative && data?.url) {
        window.open(data.url, '_system');
      }
      // Don't set loading to false on success - user will be redirected
    } catch (err: any) {
      console.error('Google Sign-In exception:', err);
      if (err?.message?.includes('cancelled') || err?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      toast.error('Google Sign-In is temporarily unavailable. Please use email.');
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      const isNative = window.hasOwnProperty('Capacitor') && (window as any).Capacitor?.isNativePlatform?.();
      
      const redirectUrl = isNative 
        ? 'laten://auth/callback' 
        : `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email,public_profile',
        },
      });
      
      if (error) {
        console.error('Facebook Sign-In error:', error);
        if (error.message.includes('provider is not enabled')) {
          toast.error('Facebook Sign-In is not configured. Please use email/password.');
        } else {
          toast.error('Unable to sign in with Facebook. Please try another method.');
        }
        setLoading(false);
        return;
      }
      
      if (isNative && data?.url) {
        window.open(data.url, '_system');
      }
    } catch (err: any) {
      console.error('Facebook Sign-In exception:', err);
      if (err?.message?.includes('cancelled') || err?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      toast.error('Facebook Sign-In is temporarily unavailable. Please use email.');
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      // For native iOS apps, we need to use the app's custom URL scheme
      // Check if we're in a native Capacitor environment
      const isNative = window.hasOwnProperty('Capacitor') && (window as any).Capacitor?.isNativePlatform?.();
      
      // Use custom scheme for native apps, web origin for browser
      const redirectUrl = isNative 
        ? 'laten://auth/callback' 
        : window.location.origin;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          scopes: 'name email',
          skipBrowserRedirect: isNative, // Skip automatic redirect on native
        },
      });
      
      if (error) {
        console.error('Apple Sign-In error:', error);
        // Handle specific error cases gracefully
        if (error.message.includes('provider is not enabled') || error.message.includes('Provider not found')) {
          toast.error('Apple Sign-In is currently unavailable. Please use email/password or Google.');
        } else if (error.message.includes('popup') || error.message.includes('blocked')) {
          toast.error('Please allow popups for this site to use Apple Sign-In.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
          // User cancelled - don't show error
          setLoading(false);
          return;
        } else {
          // Generic fallback - don't expose technical details
          toast.error('Apple Sign-In is currently unavailable. Please try email/password or Google.');
        }
        setLoading(false);
        return;
      }
      
      // For native apps, we need to open the URL manually
      if (isNative && data?.url) {
        // Open the OAuth URL in the system browser
        window.open(data.url, '_system');
      } else if (!data?.url) {
        toast.error('Apple Sign-In is currently unavailable. Please try email/password or Google.');
        setLoading(false);
        return;
      }
      
      // Success - user will be redirected, don't set loading to false
    } catch (err: any) {
      console.error('Apple Sign-In exception:', err);
      // Handle user cancellation silently
      if (err?.message?.includes('cancelled') || err?.message?.includes('canceled') || err?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      // Don't show technical errors - use friendly message
      toast.error('Apple Sign-In is currently unavailable. Please use email/password or Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img src={latenLogo} alt="Laten" className="w-20 h-20 object-contain" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-display font-bold mb-2">
            {isLogin ? t('home.greeting') : t('onboarding.welcome')}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? t('auth.signIn') : t('auth.signUp')}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-12 h-14 bg-card/50 border-border/50 focus:border-primary"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.displayName}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-border/50 focus:border-primary"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-card/50 border-border/50 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            {!isLogin && password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        passwordStrength >= level
                          ? level <= 2 ? 'bg-destructive' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'} password
                </p>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Check className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t('onboarding.mustBe18')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : (
              <>
                {isLogin ? t('auth.signIn') : t('auth.signUp')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 gap-3 bg-card/50 border-border/50 hover:bg-card hover:border-border disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          {/* Apple Sign In - Required by Apple App Store Guidelines */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAppleSignIn}
            disabled={loading}
            className="w-full h-14 gap-3 bg-card/50 border-border/50 hover:bg-card hover:border-border disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>

          {/* Facebook Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className="w-full h-14 gap-3 bg-card/50 border-border/50 hover:bg-card hover:border-border disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </Button>
        </motion.form>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-muted-foreground">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-2 text-primary font-semibold hover:underline"
            >
              {isLogin ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
