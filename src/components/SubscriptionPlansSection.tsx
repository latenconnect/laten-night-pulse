import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Sparkles, Music2, Wine, Camera, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { DJ_SUBSCRIPTION_PRICE } from '@/hooks/useDJs';
import { BARTENDER_SUBSCRIPTION_PRICE } from '@/hooks/useBartenders';

// Subscription tier configuration - ready for Stripe integration
export const SUBSCRIPTION_TIERS = {
  dj: {
    id: 'dj_standard',
    name: 'DJ Subscription',
    icon: Music2,
    price: DJ_SUBSCRIPTION_PRICE,
    currency: 'HUF',
    interval: 'month',
    color: 'primary',
    features: [
      'Appear in DJ search results',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: null, // Will be set after Stripe integration
  },
  bartender: {
    id: 'bartender_standard',
    name: 'Bartender Subscription',
    icon: Wine,
    price: BARTENDER_SUBSCRIPTION_PRICE,
    currency: 'HUF',
    interval: 'month',
    color: 'amber',
    features: [
      'Appear in bartender search',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: null,
  },
  professional: {
    id: 'professional_standard',
    name: 'Professional Subscription',
    icon: Camera,
    price: 4000,
    currency: 'HUF',
    interval: 'month',
    color: 'cyan',
    features: [
      'Appear in professional search',
      'Receive booking requests',
      'Multi-profession profile',
      'Portfolio showcase',
      'Priority support',
    ],
    stripePriceId: null,
  },
  venue: {
    id: 'venue_boost',
    name: 'Venue Boost',
    icon: Sparkles,
    price: 15000,
    currency: 'HUF',
    interval: 'month',
    color: 'secondary',
    features: [
      'Featured venue badge',
      'Priority in search results',
      'Analytics dashboard',
      'Event promotion tools',
      'Dedicated support',
    ],
    stripePriceId: null,
  },
};

interface SubscriptionPlanCardProps {
  tier: typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];
  onSubscribe: () => void;
  isPopular?: boolean;
}

const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({ tier, onSubscribe, isPopular }) => {
  const { t } = useLanguage();
  const Icon = tier.icon;
  
  const colorClasses = {
    primary: {
      border: 'border-primary/30 hover:border-primary/50',
      bg: 'bg-primary/5',
      icon: 'text-primary bg-primary/20',
      badge: 'bg-primary/20 text-primary',
      button: 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
      check: 'text-primary bg-primary/20',
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      bg: 'bg-amber-500/5',
      icon: 'text-amber-500 bg-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-500',
      button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black',
      check: 'text-amber-500 bg-amber-500/20',
    },
    cyan: {
      border: 'border-cyan-400/30 hover:border-cyan-400/50',
      bg: 'bg-cyan-400/5',
      icon: 'text-cyan-400 bg-cyan-400/20',
      badge: 'bg-cyan-400/20 text-cyan-400',
      button: 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-black',
      check: 'text-cyan-400 bg-cyan-400/20',
    },
    secondary: {
      border: 'border-secondary/30 hover:border-secondary/50',
      bg: 'bg-secondary/5',
      icon: 'text-secondary bg-secondary/20',
      badge: 'bg-secondary/20 text-secondary',
      button: 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70',
      check: 'text-secondary bg-secondary/20',
    },
  };
  
  const colors = colorClasses[tier.color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="w-[280px] flex-shrink-0"
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${colors.border} ${colors.bg}`}>
        {isPopular && (
          <div className="absolute top-0 right-0">
            <Badge className={`${colors.badge} rounded-none rounded-bl-lg border-0`}>
              Popular
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">{tier.name}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {tier.price.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-sm">
              {tier.currency} / {t('month') || 'month'}
            </span>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {tier.features.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${colors.check}`}>
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Subscribe Button */}
          <Button 
            className={`w-full gap-2 ${colors.button}`}
            onClick={onSubscribe}
          >
            <Crown className="h-4 w-4" />
            {t('subscribeNow') || 'Subscribe Now'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SubscriptionPlansSection: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Navigate to the appropriate dashboard/profile page based on tier
    switch (tierId) {
      case 'dj_standard':
        navigate('/dj/dashboard');
        break;
      case 'bartender_standard':
        navigate('/bartender/dashboard');
        break;
      case 'professional_standard':
        navigate('/professional/dashboard');
        break;
      case 'venue_boost':
        navigate('/venues');
        break;
      default:
        navigate('/profile');
    }
  };

  const tiers = Object.values(SUBSCRIPTION_TIERS);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-xl">
            {t('subscriptionPlans') || 'Subscription Plans'}
          </h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {t('forProfessionals') || 'For Professionals'}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {t('subscriptionDescription') || 'Join as a professional and start receiving booking requests'}
      </p>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth-mobile">
        {tiers.map((tier, index) => (
          <SubscriptionPlanCard
            key={tier.id}
            tier={tier}
            onSubscribe={() => handleSubscribe(tier.id)}
            isPopular={index === 0}
          />
        ))}
      </div>
      
      {/* Stripe ready note */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        {t('stripeSecurePayment') || 'Secure payments powered by Stripe • Cancel anytime'}
      </p>
    </section>
  );
};

export default SubscriptionPlansSection;
