import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface iOSSubscriptionNoticeProps {
  subscriptionType: 'dj' | 'bartender' | 'professional' | 'party_boost';
  onOpenWeb?: () => void;
}

/**
 * iOS App Store Guideline 3.1.1 Compliance
 * On native iOS, we cannot offer external payment methods for digital content.
 * This notice informs users that subscriptions will be available via the App Store
 * once In-App Purchases are implemented.
 */
export const IOSSubscriptionNotice: React.FC<iOSSubscriptionNoticeProps> = ({
  subscriptionType,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-muted-foreground/20 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-semibold text-sm">Subscription Coming Soon</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium subscriptions will be available for purchase directly in the app via the App Store. Stay tuned!
                </p>
              </div>
              
              <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  If you have an existing subscription, it will be automatically recognized once App Store subscriptions are enabled.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IOSSubscriptionNotice;
