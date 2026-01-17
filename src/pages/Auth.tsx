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
      // Check if we're in a native Capacitor environment
      const capacitor = (window as any).Capacitor;
      const isNative = capacitor?.isNativePlatform?.();
      const platform = capacitor?.getPlatform?.() || 'web';
      
      console.log('Apple Sign-In initiated:', { isNative, platform });
      
      if (isNative && platform === 'ios') {
        // Use native Sign in with Apple for iOS - this uses ASAuthorizationController
        // which Apple requires for native apps
        try {
          const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
          
          // Generate a cryptographically secure nonce
          const rawNonce = crypto.randomUUID();
          const state = crypto.randomUUID();
          
          console.log('Calling SignInWithApple.authorize...');
          
          // Note: For native iOS, clientId must be the App Bundle ID
          // The redirectURI is used for validation but the actual flow is handled natively
          const result = await SignInWithApple.authorize({
            clientId: 'com.laten.app',
            redirectURI: 'https://laten-night-pulse.lovable.app/auth/callback',
            scopes: 'email name',
            state: state,
            nonce: rawNonce,
          });
          
          console.log('Native Apple Sign-In response received:', {
            hasIdentityToken: !!result.response?.identityToken,
            hasAuthorizationCode: !!result.response?.authorizationCode,
            email: result.response?.email ? '[REDACTED]' : 'not provided',
            user: result.response?.user ? '[REDACTED]' : 'not provided',
          });
          
          if (result.response?.identityToken) {
            console.log('Authenticating with Supabase using identity token...');
            
            // Use signInWithIdToken to authenticate with Supabase using the native token
            const { data: authData, error: signInError } = await supabase.auth.signInWithIdToken({
              provider: 'apple',
              token: result.response.identityToken,
              nonce: rawNonce,
            });
            
            if (signInError) {
              console.error('Supabase signInWithIdToken error:', {
                message: signInError.message,
                status: signInError.status,
                name: signInError.name,
              });
              
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
            
            console.log('Supabase authentication successful:', {
              userId: authData?.user?.id ? '[REDACTED]' : 'none',
              hasSession: !!authData?.session,
            });
            
            toast.success('Welcome!');
            navigate('/explore');
          } else {
            console.error('No identity token received from Apple');
            toast.error('Apple Sign-In failed. No authentication token received.');
            setLoading(false);
          }
        } catch (nativeError: any) {
          console.error('Native Apple Sign-In error:', {
            message: nativeError?.message,
            code: nativeError?.code,
            name: nativeError?.name,
            stack: nativeError?.stack,
          });
          
          // Handle user cancellation silently (multiple error codes for different iOS versions)
          const isCancellation = 
            nativeError?.message?.toLowerCase()?.includes('cancel') ||
            nativeError?.code === 1001 ||  // ASAuthorizationError.canceled
            nativeError?.code === 1000 ||  // ASAuthorizationError.unknown (sometimes used for cancel)
            nativeError?.code === 'ERR_CANCELED' ||
            nativeError?.code === 'PLUGIN_ERROR' && nativeError?.message?.includes('cancel');
          
          if (isCancellation) {
            console.log('User cancelled Apple Sign-In');
            setLoading(false);
            return;
          }
          
          // Handle specific error codes
          if (nativeError?.code === 1002) {
            // ASAuthorizationError.invalidResponse
            toast.error('Apple Sign-In received an invalid response. Please try again.');
          } else if (nativeError?.code === 1003) {
            // ASAuthorizationError.notHandled
            toast.error('Apple Sign-In was not handled. Please ensure you have an Apple ID configured.');
          } else if (nativeError?.code === 1004) {
            // ASAuthorizationError.failed
            toast.error('Apple Sign-In failed. Please check your internet connection and try again.');
          } else {
            toast.error('Apple Sign-In is currently unavailable. Please try email/password.');
          }
          setLoading(false);
        }
      } else {
        // Web or Android fallback - use OAuth redirect
        console.log('Using OAuth redirect flow for Apple Sign-In');
        const redirectUrl = `${window.location.origin}/auth`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: redirectUrl,
            scopes: 'name email',
          },
        });
        
        if (error) {
          console.error('Apple OAuth error:', error);
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
          console.error('No OAuth URL returned for Apple Sign-In');
          toast.error('Apple Sign-In is currently unavailable. Please try email/password or Google.');
          setLoading(false);
        }
        // Success - user will be redirected
      }
    } catch (err: any) {
      console.error('Apple Sign-In exception:', err);
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

          {/* Sign in with Apple - Listed FIRST per Apple Guidelines 4.8 */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAppleSignIn}
            disabled={loading}
            className="w-full h-14 gap-3 bg-card/50 border-border/50 hover:bg-card/80 disabled:opacity-50"
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
