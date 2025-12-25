import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const sessionId = searchParams.get('session_id');

  const syncSubscription = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[SubscriptionSuccess] Syncing subscription...');
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('[SubscriptionSuccess] Error syncing subscription:', error);
        return false;
      }
      
      if (data?.hasActiveSubscription) {
        console.log('[SubscriptionSuccess] Active subscription found!', data);
        toast.success('Subscription activated successfully!');
        
        // Invalidate ALL subscription-related queries immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['stripe-subscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['dj-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['my-dj-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['bartender-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['my-bartender-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['professional-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['my-professional-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['venue-subscription'] }),
          queryClient.invalidateQueries({ queryKey: ['djs'] }),
          queryClient.invalidateQueries({ queryKey: ['bartenders'] }),
          queryClient.invalidateQueries({ queryKey: ['professionals'] }),
        ]);
        
        return true;
      }
      
      console.log('[SubscriptionSuccess] No active subscription found yet');
      return false;
    } catch (err) {
      console.error('[SubscriptionSuccess] Sync error:', err);
      return false;
    }
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const attemptSync = async () => {
      if (!isMounted) return;

      const success = await syncSubscription();
      
      if (success) {
        setSyncComplete(true);
        setSyncing(false);
      } else if (retryCount < 5) {
        // Retry up to 5 times with increasing delays
        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 5000);
        console.log(`[SubscriptionSuccess] Retrying in ${delay}ms (attempt ${retryCount + 1}/5)`);
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setRetryCount(prev => prev + 1);
          }
        }, delay);
      } else {
        // Max retries reached, show partial success
        setSyncing(false);
        toast.info('Payment received! Features may take a moment to activate.');
      }
    };

    // Initial delay to give Stripe time to process
    const initialDelay = retryCount === 0 ? 2000 : 0;
    timeoutId = setTimeout(attemptSync, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [syncSubscription, retryCount]);

  const handleManualRetry = async () => {
    setSyncing(true);
    setRetryCount(0);
    const success = await syncSubscription();
    if (success) {
      setSyncComplete(true);
    }
    setSyncing(false);
  };

  const handleContinue = () => {
    // Navigate to profile where they can see their dashboards
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {syncing ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Activating Your Subscription
            </h1>
            <p className="text-muted-foreground">
              Please wait while we set up your premium features...
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Attempt {retryCount + 1}/5...
              </p>
            )}
          </>
        ) : syncComplete ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Welcome to Premium!
              </h1>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-muted-foreground mb-8">
              Your subscription is now active. All premium features are unlocked and ready to use immediately.
            </p>
            <Button onClick={handleContinue} size="lg" className="w-full">
              Continue to Dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Payment Received!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment was successful. If your features aren't active yet, try refreshing.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleManualRetry} variant="outline" size="lg" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button onClick={handleContinue} size="lg" className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
