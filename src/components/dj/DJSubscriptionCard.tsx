import { motion } from 'framer-motion';
import { Crown, Check, AlertCircle, Apple } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { DJ_SUBSCRIPTION_PRICE, DJSubscription } from '@/hooks/useDJs';
import { usePlatform } from '@/hooks/usePlatform';
import IOSSubscriptionNotice from '@/components/subscription/iOSSubscriptionNotice';
import { format } from 'date-fns';

interface DJSubscriptionCardProps {
  subscription: DJSubscription | null;
  profileId?: string;
  onSubscribe: () => void;
  onPurchaseComplete?: () => void;
  loading?: boolean;
}

const SUBSCRIPTION_FEATURES = [
  'appearInSearch',
  'receiveBookingRequests',
  'chatWithClients',
  'getRatingsReviews',
  'prioritySupport',
];

export const DJSubscriptionCard = ({ 
  subscription, 
  profileId,
  onSubscribe, 
  onPurchaseComplete,
  loading 
}: DJSubscriptionCardProps) => {
  const { t } = useLanguage();
  const { isIOS } = usePlatform();

  const isActive = subscription?.status === 'active' && 
    subscription.expires_at && 
    new Date(subscription.expires_at) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
        {/* Glow effect for active */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        )}

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {t('djSubscription')}
            </CardTitle>
            {isActive && (
              <Badge className="bg-primary/20 text-primary border-0">
                {t('active')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Price */}
          <div className="text-center py-4">
            <span className="text-4xl font-bold text-foreground">
              €{DJ_SUBSCRIPTION_PRICE}
            </span>
            <span className="text-muted-foreground ml-2">/ {t('month')}</span>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {SUBSCRIPTION_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Check className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-sm text-foreground">{t(feature)}</span>
              </li>
            ))}
          </ul>

          {/* Status / Expiry */}
          {isActive && subscription?.expires_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {t('expiresOn')}: {format(new Date(subscription.expires_at), 'PPP')}
              </span>
            </div>
          )}

          {/* Subscribe Button - iOS */}
          {!isActive && isIOS && (
            <IOSSubscriptionNotice 
              subscriptionType="dj" 
              profileId={profileId}
              onPurchaseComplete={onPurchaseComplete}
            />
          )}

          {/* Subscribe Button - Web/Android */}
          {!isActive && !isIOS && (
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
              size="lg"
              onClick={onSubscribe}
              disabled={loading}
            >
              <Crown className="h-4 w-4" />
              {loading ? t('processing') : t('subscribeNow')}
            </Button>
          )}

          {isActive && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Apple className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t('manageViaAppStore')}
              </span>
            </div>
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
