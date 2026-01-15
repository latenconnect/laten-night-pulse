import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'laten_cookie_consent';

/**
 * Session & Essential Cookies Notice
 * 
 * This component informs users about essential cookies used for:
 * - Authentication (keeping users logged in)
 * - Session management
 * - User preferences (language, theme)
 * 
 * IMPORTANT: This app does NOT use cookies for tracking or advertising.
 * We do NOT share data with third parties for advertising purposes.
 * This notice is for transparency only - not for tracking consent.
 */
const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we're in a native app environment - skip cookie notice
    const isNative = window.hasOwnProperty('Capacitor') && (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      return; // Don't show cookie notice in native apps
    }

    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'acknowledged');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-28 left-4 right-4 z-[100] md:bottom-6 md:left-auto md:right-6 md:max-w-md safe-bottom"
        >
          <div className="glass-card p-4 border border-border shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Session & Security</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  We use essential cookies only for authentication and keeping you logged in. 
                  <strong className="text-foreground"> We do not track you or use cookies for advertising.</strong>{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={handleAcknowledge}
                    className="flex-1"
                  >
                    Got it
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
