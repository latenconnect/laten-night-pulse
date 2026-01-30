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

  // Reset loading state on mount and when page becomes visible again
  // This handles interrupted OAuth flows where user leaves and returns
  useEffect(() => {
    // Reset on mount
    setLoading(false);
    
    // Also reset when page becomes visible again (handles back button, tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !user) {
        setLoading(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

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
        // Error handled below
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
      // Exception handled below
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
        // Error handled below
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
      // Exception handled below
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
      // Check if we're in a native Capacitor environment
      const capacitor = (window as any).Capacitor;
      const isNative = capacitor?.isNativePlatform?.();
      const platform = capacitor?.getPlatform?.() || 'web';
      
      // Native Apple Sign-In for iOS, OAuth for web/Android
      
      if (isNative && platform === 'ios') {
        // Use native Sign in with Apple for iOS - this uses ASAuthorizationController
        // which Apple requires for native apps
        try {
          const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
          
          // Generate a cryptographically secure nonce
          const rawNonce = crypto.randomUUID();
          
          console.log('[Apple Sign-In] Starting native authorization...');
          
          // Create a promise race with timeout to handle iPad presentation issues
          const authorizationPromise = SignInWithApple.authorize({
            clientId: 'com.laten.app',
            redirectURI: 'https://laten-night-pulse.lovable.app/auth/callback',
            scopes: 'email name',
            nonce: rawNonce,
          });
          
          // Add a 60 second timeout for the authorization
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('APPLE_SIGNIN_TIMEOUT'));
            }, 60000);
          });
          
          let result;
          try {
            result = await Promise.race([authorizationPromise, timeoutPromise]);
          } catch (raceError: any) {
            if (raceError?.message === 'APPLE_SIGNIN_TIMEOUT') {
              console.log('[Apple Sign-In] Timeout - authorization took too long');
              toast.error('Apple Sign-In timed out. Please try again.');
              setLoading(false);
              return;
            }
            throw raceError;
          }
          
          console.log('[Apple Sign-In] Authorization result received');
          
          if (result.response?.identityToken) {
            console.log('[Apple Sign-In] Identity token received, exchanging with Supabase...');
            
            // Use signInWithIdToken to authenticate with Supabase using the native token
            const { data: authData, error: signInError } = await supabase.auth.signInWithIdToken({
              provider: 'apple',
              token: result.response.identityToken,
              nonce: rawNonce,
            });
            
            if (signInError) {
              console.error('[Apple Sign-In] Supabase error:', signInError);
              // Provide more specific error messages
              if (signInError.message.includes('nonce')) {
                toast.error('Authentication verification failed. Please try again.');
              } else if (signInError.message.includes('token')) {
                toast.error('Invalid authentication token. Please try again.');
              } else {
                toast.error('Unable to complete sign in. Please try again.');
              }
              setLoading(false);
              return;
            }
            
            console.log('[Apple Sign-In] Successfully authenticated!');
            toast.success('Welcome!');
            navigate('/explore');
          } else {
            console.error('[Apple Sign-In] No identity token in response');
            toast.error('Apple Sign-In failed. No authentication token received.');
            setLoading(false);
          }
        } catch (nativeError: any) {
          console.error('[Apple Sign-In] Native error:', nativeError);
          
          // Handle user cancellation silently (multiple error codes for different iOS versions)
          const errorCode = nativeError?.code;
          const errorMessage = nativeError?.message?.toLowerCase() || '';
          
          const isCancellation = 
            errorMessage.includes('cancel') ||
            errorCode === 1001 ||  // ASAuthorizationError.canceled
            errorCode === 1000 ||  // ASAuthorizationError.unknown (sometimes used for cancel)
            errorCode === 'ERR_CANCELED' ||
            (errorCode === 'PLUGIN_ERROR' && errorMessage.includes('cancel'));
          
          if (isCancellation) {
            console.log('[Apple Sign-In] User cancelled');
            setLoading(false);
            return;
          }
          
          // Handle specific ASAuthorizationError codes
          if (errorCode === 1002) {
            // ASAuthorizationError.invalidResponse
            toast.error('Apple Sign-In received an invalid response. Please try again.');
          } else if (errorCode === 1003) {
            // ASAuthorizationError.notHandled
            toast.error('Apple Sign-In was not handled. Please ensure you have an Apple ID configured.');
          } else if (errorCode === 1004) {
            // ASAuthorizationError.failed
            toast.error('Apple Sign-In failed. Please check your internet connection and try again.');
          } else if (errorMessage.includes('not available') || errorMessage.includes('not supported')) {
            // Plugin not properly initialized or not available
            toast.error('Apple Sign-In is not available on this device. Please use email/password.');
          } else {
            // Generic fallback error
            toast.error('Apple Sign-In is currently unavailable. Please try email/password.');
          }
          setLoading(false);
        }
      } else {
        // Web or Android fallback - use OAuth redirect
        const redirectUrl = `${window.location.origin}/auth`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: redirectUrl,
            scopes: 'name email',
          },
        });
        
        if (error) {
          if (error.message.includes('provider is not enabled') || error.message.includes('Provider not found')) {
            toast.error('Apple Sign-In is currently unavailable. Please use email/password or Google.');
          } else if (error.message.includes('popup') || error.message.includes('blocked')) {
            toast.error('Please allow popups for this site to use Apple Sign-In.');
          } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
            setLoading(false);
            return;
          } else {
            toast.error('Apple Sign-In is currently unavailable. Please try email/password or Google.');
          }
          setLoading(false);
          return;
        }
        
        if (!data?.url) {
          toast.error('Apple Sign-In is currently unavailable. Please try email/password or Google.');
          setLoading(false);
        }
        // Success - user will be redirected
      }
    } catch (err: any) {
      console.error('[Apple Sign-In] Unexpected error:', err);
      if (err?.message?.includes('cancelled') || err?.message?.includes('canceled') || err?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      toast.error('Apple Sign-In is currently unavailable. Please use email/password or Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-neon-pink/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <img src={latenLogo} alt="Laten" className="w-24 h-24 object-contain" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            {isLogin ? t('home.greeting') : t('onboarding.welcome')}
          </h1>
          <p className="text-muted-foreground text-[15px]">
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
                className="space-y-1.5"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <Input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-12 h-14"
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive flex items-center gap-1.5 pl-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.displayName}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1.5 pl-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1.5 pl-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            {!isLogin && password && (
              <div className="mt-3 px-1">
                <div className="flex gap-1.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        passwordStrength >= level
                          ? level <= 2 ? 'bg-destructive' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-muted/50'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'} password
                </p>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {t('onboarding.mustBe18')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-[16px] font-semibold mt-2"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : (
              <>
                {isLogin ? t('auth.signIn') : t('auth.signUp')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-background px-4 text-muted-foreground/70">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Sign in with Apple - Listed FIRST per Apple Guidelines 4.8 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAppleSignIn}
              disabled={loading}
              className="social-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continue with Apple
            </Button>
            
            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="social-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
            
            {/* Facebook Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleFacebookSignIn}
              disabled={loading}
              className="social-login-btn"
            >
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </Button>
          </div>
        </motion.form>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-muted-foreground text-[14px]">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-2 text-primary font-semibold hover:underline underline-offset-2"
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
