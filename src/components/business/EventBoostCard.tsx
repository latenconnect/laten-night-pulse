import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';

interface EventBoostCardProps {
  eventId: string;
  eventName: string;
  onBoost: (boostType: 'spotlight' | 'homepage' | 'push') => void;
  loading?: boolean;
}

const BOOST_OPTIONS = [
  {
    type: 'spotlight' as const,
    name: 'Spotlight',
    price: 10000, // €100
    icon: TrendingUp,
    description: 'Priority placement in search and feed for 24 hours',
    duration: '24 hours',
  },
  {
    type: 'homepage' as const,
    name: 'Homepage Feature',
    price: 20000, // €200
    icon: Rocket,
    description: 'Featured on homepage carousel for 48 hours',
    duration: '48 hours',
  },
  {
    type: 'push' as const,
    name: 'Push Campaign',
    price: 30000, // €300
    icon: Bell,
    description: 'Push notification to relevant users in your city',
    duration: 'One-time',
  },
];

export const EventBoostCard: React.FC<EventBoostCardProps> = ({
  eventId,
  eventName,
  onBoost,
  loading,
}) => {
  const { t } = useLanguage();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <Rocket className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{t('business.boostEvent')}</h3>
          <p className="text-sm text-muted-foreground">
            Boost <span className="font-medium text-foreground">{eventName}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {BOOST_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          
          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {option.duration}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">
                    {formatPrice(option.price)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onBoost(option.type)}
                    disabled={loading}
                  >
                    {t('business.buyNow')}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
