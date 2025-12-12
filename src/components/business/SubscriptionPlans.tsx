import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/hooks/useVenueSubscription';

interface SubscriptionPlansProps {
  currentTier?: SubscriptionTier;
  onSelectPlan: (tier: SubscriptionTier) => void;
  loading?: boolean;
}

const tierIcons = {
  basic: Crown,
  boost: Zap,
  ultimate: Rocket,
};

const tierColors = {
  basic: 'from-zinc-600 to-zinc-800',
  boost: 'from-purple-600 to-pink-600',
  ultimate: 'from-amber-500 to-orange-600',
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentTier,
  onSelectPlan,
  loading,
}) => {
  const { t, tArray } = useLanguage();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(Object.keys(SUBSCRIPTION_TIERS) as SubscriptionTier[]).map((tier, index) => {
        const tierData = SUBSCRIPTION_TIERS[tier];
        const Icon = tierIcons[tier];
        const isCurrentPlan = currentTier === tier;
        const isPopular = tier === 'boost';

        return (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`relative overflow-hidden p-6 ${
                isPopular
                  ? 'border-2 border-primary ring-2 ring-primary/20'
                  : 'border-border/50'
              }`}
            >
              {isPopular && (
                <Badge className="absolute top-4 right-4 bg-primary">
                  Popular
                </Badge>
              )}

              {/* Header */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tierColors[tier]} mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">
                {t(`business.${tier}`)}
              </h3>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold">
                  {formatPrice(tierData.price)}
                </span>
                <span className="text-muted-foreground">
                  {t('business.perMonth')}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tierData.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full ${
                  isPopular
                    ? 'bg-gradient-to-r from-primary to-purple-600 hover:opacity-90'
                    : ''
                }`}
                variant={isPopular ? 'default' : 'outline'}
                disabled={loading || isCurrentPlan}
                onClick={() => onSelectPlan(tier)}
              >
                {isCurrentPlan
                  ? t('business.currentPlan')
                  : currentTier
                  ? t('business.upgrade')
                  : t('business.selectPlan')}
              </Button>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
