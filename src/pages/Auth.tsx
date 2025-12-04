import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import latenLogo from '@/assets/laten-logo.png';

const emailSchema = z.string().trim().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const displayNameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name too long');

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/explore');
    }
  }, [user, navigate]);

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
            {isLogin ? 'Welcome Back' : 'Join Laten'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to discover events' : 'Create your account to get started'}
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
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-border/50 focus:border-primary"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Check className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                By signing up, you confirm you are 18+ years old
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
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
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
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="ml-2 text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
