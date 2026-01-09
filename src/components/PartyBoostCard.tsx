import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Crown, Check, Loader2, Sparkles, TrendingUp, Bell, BarChart3, Hash, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHost } from '@/hooks/useHost';
import { useAuth } from '@/context/AuthContext';
import { useHostSubscription } from '@/hooks/useHostSubscription';
import { useLanguage } from '@/context/LanguageContext';
import { usePlatform } from '@/hooks/usePlatform';
import IOSSubscriptionNotice from '@/components/subscription/iOSSubscriptionNotice';

const BOOST_FEATURES = [
  { icon: TrendingUp, label: 'Priority Feed Placement' },
  { icon: Sparkles, label: 'Featured Party Badge' },
  { icon: Bell, label: 'Push Notifications' },
  { icon: BarChart3, label: 'Real-time Analytics' },
  { icon: Hash, label: 'Trending Section' },
  { icon: Share2, label: 'Social Templates' },
];

const PartyBoostCard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { host, isVerifiedHost, loading: hostLoading } = useHost();
  const { subscription, isSubscribed, loading, createCheckout } = useHostSubscription(host?.id);
  const { isIOS } = usePlatform();

  const handleSubscribe = async () => {
    if (!host?.id) return;
    await createCheckout(host.id);
  };

  // Only show for verified hosts
  if (!user || hostLoading) return null;
  if (!isVerifiedHost || !host) return null;

  // Already subscribed
  if (isSubscribed && subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, hsl(330 100% 50% / 0.15) 0%, hsl(270 100% 60% / 0.15) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-pink-500/30 rounded-2xl" />
        <div className="absolute top-0 right-0">
          <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 rounded-none rounded-bl-lg border-0">
            Active
          </Badge>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Party Boost</h3>
              <p className="text-sm text-pink-400">All your events are boosted!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {BOOST_FEATURES.slice(0, 4).map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-pink-500" />
                  </div>
                  <span className="text-muted-foreground text-xs">{feature.label}</span>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Renews: {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Show iOS notice if on native iOS
  if (isIOS) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, hsl(330 100% 50% / 0.1) 0%, hsl(270 100% 60% / 0.1) 100%)',
        }}
      >
        <div className="absolute inset-0 border border-pink-500/20 rounded-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-pink-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg">Party Boost</h3>
                <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 text-xs">
                  €10/mo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Boost all your events automatically
              </p>
            </div>
          </div>
          
          <IOSSubscriptionNotice subscriptionType="party_boost" />
        </div>
      </motion.div>
    );
  }

  // Show subscribe CTA for web/Android
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(330 100% 50% / 0.1) 0%, hsl(270 100% 60% / 0.1) 100%)',
      }}
    >
      <div className="absolute inset-0 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl transition-colors" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-pink-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg">Party Boost</h3>
              <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 text-xs">
                €10/mo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Boost all your events automatically
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {BOOST_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Icon className="h-3 w-3 text-pink-400" />
                </div>
                <span className="text-muted-foreground text-xs">{feature.label}</span>
              </div>
            );
          })}
        </div>
        
        <Button 
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crown className="w-4 h-4" />
          )}
          Subscribe & Boost Events
        </Button>
      </div>
    </motion.div>
  );
};

export default PartyBoostCard;