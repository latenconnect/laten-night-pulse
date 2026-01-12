import React from 'react';
import { motion } from 'framer-motion';
import { Apple, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIOSPurchases, IOSProductType } from '@/hooks/useIOSPurchases';

interface iOSSubscriptionNoticeProps {
  subscriptionType: 'dj' | 'bartender' | 'professional' | 'party_boost';
  profileId?: string;
  onPurchaseComplete?: () => void;
}

/**
 * iOS In-App Purchase component
 * Handles native iOS subscriptions via App Store
 */
export const IOSSubscriptionNotice: React.FC<iOSSubscriptionNoticeProps> = ({
  subscriptionType,
  profileId,
  onPurchaseComplete,
}) => {
  const { 
    purchase, 
    restorePurchases, 
    getProduct, 
    loading, 
    purchasing,
    isAvailable,
  } = useIOSPurchases();

  const product = getProduct(subscriptionType as IOSProductType);

  const handlePurchase = async () => {
    if (!profileId) {
      return;
    }
    const success = await purchase(subscriptionType as IOSProductType, profileId);
    if (success && onPurchaseComplete) {
      onPurchaseComplete();
    }
  };

  const handleRestore = async () => {
    await restorePurchases();
    if (onPurchaseComplete) {
      onPurchaseComplete();
    }
  };

  // Loading state while products are being fetched
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-muted-foreground/20 bg-muted/20">
          <CardContent className="p-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading subscription options...</span>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // IAP not available (simulator, etc.)
  if (!isAvailable) {
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
                <h4 className="font-semibold text-sm">Subscription Available</h4>
                <p className="text-xs text-muted-foreground">
                  Premium subscriptions are available for purchase directly in the app via the App Store.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRestore}
                  className="w-full mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restore Purchases
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm">
                  {product?.title || 'Premium Subscription'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {product?.description || 'Get access to all premium features'}
                </p>
                {product?.price && (
                  <p className="text-sm font-medium text-primary mt-1">
                    {product.price}/month
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handlePurchase}
                  disabled={purchasing || !profileId}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Apple className="w-4 h-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRestore}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center">
                Subscription will auto-renew monthly. Cancel anytime in App Store settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IOSSubscriptionNotice;
