import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface iOSSubscriptionNoticeProps {
  subscriptionType: 'dj' | 'bartender' | 'professional' | 'party_boost';
  onOpenWeb?: () => void;
}

const SUBSCRIPTION_URLS: Record<string, string> = {
  dj: '/dj/dashboard',
  bartender: '/bartender/dashboard', 
  professional: '/professional/dashboard',
  party_boost: '/profile',
};

export const IOSSubscriptionNotice: React.FC<iOSSubscriptionNoticeProps> = ({
  subscriptionType,
  onOpenWeb,
}) => {
  const handleOpenInBrowser = () => {
    // Get the web URL for subscription
    const baseUrl = window.location.origin.replace('capacitor://', 'https://');
    const path = SUBSCRIPTION_URLS[subscriptionType] || '/profile';
    const webUrl = `${baseUrl}${path}?subscribe=true`;
    
    // Open in system browser
    window.open(webUrl, '_system');
    onOpenWeb?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-sm">Subscribe via Web</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  To subscribe, please use our website. Your subscription will sync automatically to this app.
                </p>
              </div>
              
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black gap-2"
                onClick={handleOpenInBrowser}
              >
                <Globe className="w-4 h-4" />
                Open in Browser
                <ExternalLink className="w-3 h-3" />
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Already subscribed? Use "Restore Purchases" in Settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IOSSubscriptionNotice;
