import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useHaptics } from '@/hooks/useHaptics';

const NotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { permissionStatus, requestPermission, isNative } = usePushNotifications();
  const { successNotification, lightTap } = useHaptics();

  useEffect(() => {
    // Only show on native platforms where permission hasn't been decided
    if (isNative && permissionStatus === 'prompt') {
      const hasSeenPrompt = localStorage.getItem('laten_notification_prompt_seen');
      if (!hasSeenPrompt) {
        // Delay showing the prompt
        const timer = setTimeout(() => setIsVisible(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isNative, permissionStatus]);

  const handleEnable = async () => {
    await lightTap();
    const granted = await requestPermission();
    if (granted) {
      await successNotification();
    }
    localStorage.setItem('laten_notification_prompt_seen', 'true');
    setIsVisible(false);
  };

  const handleDismiss = async () => {
    await lightTap();
    localStorage.setItem('laten_notification_prompt_seen', 'true');
    setIsVisible(false);
  };

  if (!isNative) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-[100] safe-top"
        >
          <div className="glass-card p-4 border border-primary/30 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Never miss an event!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get notified about event reminders, RSVP updates, and hot parties nearby.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-1"
                  >
                    Not Now
                  </Button>
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={handleEnable}
                    className="flex-1"
                  >
                    Enable
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
