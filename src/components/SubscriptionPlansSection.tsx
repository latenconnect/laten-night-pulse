import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Music2, Wine, Camera, Rocket, Globe, ExternalLink, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { usePlatform } from '@/hooks/usePlatform';
import { toast } from 'sonner';

// Stripe Product & Price IDs (synced with Stripe dashboard)
export const STRIPE_PRODUCTS = {
  dj: { productId: 'prod_TdnvAia219rtSO', priceId: 'price_1SgWJX0pDoPM38rzyMLDI7F7' },
  bartender: { productId: 'prod_TdnwYmmUIal76I', priceId: 'price_1SgWKs0pDoPM38rzgwmlBQlE' },
  professional: { productId: 'prod_Tdnyd3McApSwtc', priceId: 'price_1SgWN00pDoPM38rzSkYpOsR4' },
  party_boost: { productId: 'prod_Te7JXXsqH06QCu', priceId: 'price_1Sgp4n0pDoPM38rzfTeVwGjo' },
};

// Subscription tier configuration - synced with Stripe prices in EUR
export const SUBSCRIPTION_TIERS = {
  dj: {
    id: 'dj_standard',
    name: 'DJ Subscription',
    icon: Music2,
    price: 15,
    currency: 'EUR',
    interval: 'month',
    color: 'primary',
    features: [
      'Appear in DJ search results',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.dj.priceId,
  },
  bartender: {
    id: 'bartender_standard',
    name: 'Bartender Subscription',
    icon: Wine,
    price: 15,
    currency: 'EUR',
    interval: 'month',
    color: 'amber',
    features: [
      'Appear in bartender search',
      'Receive booking requests',
      'Chat with potential clients',
      'Collect ratings & reviews',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.bartender.priceId,
  },
  professional: {
    id: 'professional_standard',
    name: 'Professional Subscription',
    icon: Camera,
    price: 15,
    currency: 'EUR',
    interval: 'month',
    color: 'cyan',
    features: [
      'Appear in professional search',
      'Receive booking requests',
      'Multi-profession profile',
      'Portfolio showcase',
      'Priority support',
    ],
    stripePriceId: STRIPE_PRODUCTS.professional.priceId,
  },
  partyBoost: {
    id: 'party_boost',
    name: 'Party Boost',
    icon: Rocket,
    price: 10,
    currency: 'EUR',
    interval: 'month',
    color: 'pink',
    features: [
      'Priority placement in feed',
      'Featured party badge',
      'Push notifications to users',
      'Real-time analytics',
      'Trending section visibility',
      'Social share templates',
    ],
    stripePriceId: STRIPE_PRODUCTS.party_boost.priceId,
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
    pink: {
      border: 'border-pink-500/30 hover:border-pink-500/50',
      bg: 'bg-gradient-to-br from-pink-500/10 to-purple-500/10',
      icon: 'text-pink-500 bg-gradient-to-br from-pink-500/20 to-purple-500/20',
      badge: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400',
      button: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
      check: 'text-pink-500 bg-pink-500/20',
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
              {tier.currency} / {t('business.month')}
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
            {t('business.subscribeNow')}
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
  const { isIOS } = usePlatform();

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // On iOS, open the web version in system browser
    if (isIOS) {
      const baseUrl = window.location.origin.replace('capacitor://', 'https://');
      let path = '/profile';
      
      switch (tierId) {
        case 'dj_standard':
          path = '/dj/dashboard';
          break;
        case 'bartender_standard':
          path = '/bartender/dashboard';
          break;
        case 'professional_standard':
          path = '/professional/dashboard';
          break;
        case 'party_boost':
          path = '/profile';
          break;
      }
      
      window.open(`${baseUrl}${path}?subscribe=true`, '_system');
      toast.info('Opening subscription page in browser...');
      return;
    }
    
    // Navigate to the appropriate dashboard/profile page based on tier
    switch (tierId) {
      case 'dj_standard':
        navigate('/dj/dashboard');
        toast.info('Create your DJ profile to subscribe');
        break;
      case 'bartender_standard':
        navigate('/bartender/dashboard');
        toast.info('Create your bartender profile to subscribe');
        break;
      case 'professional_standard':
        navigate('/professional/dashboard');
        toast.info('Create your professional profile to subscribe');
        break;
      case 'party_boost':
        navigate('/profile');
        toast.info('Become a verified host to unlock Party Boost');
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
            {t('business.subscriptionPlans')}
          </h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {t('business.forProfessionals')}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {t('business.subscriptionDescription')}
      </p>

      {/* iOS Notice */}
      {isIOS && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">
              Subscriptions are managed via web browser. Tap a plan to continue.
            </span>
          </div>
        </motion.div>
      )}

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
      
      {/* Payment note */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        {isIOS ? (
          <>
            <Globe className="w-3 h-3 inline mr-1" />
            Subscriptions are processed securely via our website
          </>
        ) : (
          t('business.stripeSecurePayment')
        )}
      </p>
    </section>
  );
};

export default SubscriptionPlansSection;
