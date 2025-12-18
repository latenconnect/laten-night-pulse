import { motion } from 'framer-motion';
import { Crown, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { BARTENDER_SUBSCRIPTION_PRICE, BartenderSubscription } from '@/hooks/useBartenders';
import { format } from 'date-fns';

interface BartenderSubscriptionCardProps {
  subscription: BartenderSubscription | null;
  onSubscribe: () => void;
  loading?: boolean;
}

const SUBSCRIPTION_FEATURES = [
  'appearInSearch',
  'receiveBookingRequests',
  'chatWithClients',
  'getRatingsReviews',
  'prioritySupport',
];

export const BartenderSubscriptionCard = ({ subscription, onSubscribe, loading }: BartenderSubscriptionCardProps) => {
  const { t } = useLanguage();

  const isActive = subscription?.status === 'active' && 
    subscription.expires_at && 
    new Date(subscription.expires_at) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden ${isActive ? 'border-amber-500/50 bg-amber-500/5' : 'border-border/50'}`}>
        {/* Glow effect for active */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
        )}

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
              {t('bartenderSubscription')}
            </CardTitle>
            {isActive && (
              <Badge className="bg-amber-500/20 text-amber-500 border-0">
                {t('active')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Price */}
          <div className="text-center py-4">
            <span className="text-4xl font-bold text-foreground">
              {BARTENDER_SUBSCRIPTION_PRICE.toLocaleString()}
            </span>
            <span className="text-muted-foreground ml-2">HUF / {t('month')}</span>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {SUBSCRIPTION_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isActive ? 'bg-amber-500/20' : 'bg-muted'}`}>
                  <Check className={`h-3 w-3 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-sm text-foreground">{t(feature)}</span>
              </li>
            ))}
          </ul>

          {/* Status / Expiry */}
          {isActive && subscription?.expires_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">
                {t('expiresOn')}: {format(new Date(subscription.expires_at), 'PPP')}
              </span>
            </div>
          )}

          {/* Subscribe Button */}
          {!isActive && (
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black" 
              size="lg"
              onClick={onSubscribe}
              disabled={loading}
            >
              <Crown className="h-4 w-4" />
              {loading ? t('processing') : t('subscribeNow')}
            </Button>
          )}

          {isActive && (
            <Button variant="outline" className="w-full" disabled>
              {t('subscribed')}
            </Button>
          )}

          {/* Note */}
          <p className="text-xs text-center text-muted-foreground">
            {t('subscriptionNote')}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
