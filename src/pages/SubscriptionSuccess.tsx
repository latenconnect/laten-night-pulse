import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
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
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const syncSubscription = async () => {
      try {
        // Immediately call check-subscription to sync from Stripe
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error syncing subscription:', error);
          toast.error('Failed to sync subscription. Please refresh the page.');
        } else if (data?.hasActiveSubscription) {
          toast.success('Subscription activated successfully!');
          // Invalidate all subscription-related queries
          queryClient.invalidateQueries({ queryKey: ['stripe-subscriptions'] });
          queryClient.invalidateQueries({ queryKey: ['dj-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['bartender-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['professional-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['venue-subscription'] });
        }
        
        setSyncComplete(true);
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setSyncing(false);
      }
    };

    // Small delay to ensure Stripe has processed the payment
    const timer = setTimeout(syncSubscription, 1500);
    return () => clearTimeout(timer);
  }, [queryClient, sessionId]);

  const handleContinue = () => {
    // Navigate to the appropriate dashboard based on where they came from
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
              Your subscription is now active. All premium features are unlocked and ready to use.
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
            <p className="text-muted-foreground mb-8">
              Your payment was successful. Your features will be activated shortly.
            </p>
            <Button onClick={handleContinue} size="lg" className="w-full">
              Continue to Dashboard
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
