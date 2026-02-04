import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBiometricAuth, BiometricType } from '@/hooks/useBiometricAuth';

interface BiometricAuthButtonProps {
  onAuthenticate: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// Face ID icon matching Apple's SF Symbols style
const FaceIDIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Top-left corner */}
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    {/* Top-right corner */}
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    {/* Bottom-left corner */}
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    {/* Bottom-right corner */}
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    {/* Left eye */}
    <path d="M9 9v2" />
    {/* Right eye */}
    <path d="M15 9v2" />
    {/* Nose */}
    <path d="M12 9v3" />
    {/* Smile */}
    <path d="M9 15c.83.67 1.83 1 3 1s2.17-.33 3-1" />
  </svg>
);

// Touch ID / Fingerprint icon matching Apple's SF Symbols style
const TouchIDIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    {/* Fingerprint ridges - concentric arcs */}
    <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 3 0 6 0 9" />
    <path d="M16.5 6.5C16.5 4 14.5 2 12 2" />
    <path d="M16.5 6.5v8c0 1.5-.5 3-2 4" />
    <path d="M10 6.5c0-1.1.9-2 2-2s2 .9 2 2v9c0 2.5-2 4-4 4" />
    <path d="M4.5 10c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    <path d="M12 10.5v5c0 1.5 1 2.5 2 3" />
    <path d="M7.5 8c-.6.8-1 1.8-1 3v6c0 2.2 1.8 4 4 4" />
  </svg>
);

export const BiometricAuthButton: React.FC<BiometricAuthButtonProps> = ({
  onAuthenticate,
  disabled = false,
  className = '',
}) => {
  const { isAvailable, biometricType, loading, getBiometricLabel, isNative } = useBiometricAuth();

  // Only show on native platforms with biometric capability
  if (!isNative || !isAvailable) {
    return null;
  }

  const handlePress = async () => {
    if (loading || disabled) return;
    await onAuthenticate();
  };

  const BiometricIcon = biometricType === 'face' ? FaceIDIcon : TouchIDIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <Button
        type="button"
        variant="outline"
        onClick={handlePress}
        disabled={loading || disabled}
        className="w-full h-14 text-[15px] font-medium border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-3"
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3"
          >
            <BiometricIcon className="w-6 h-6 text-primary" />
            <span>Sign in with {getBiometricLabel()}</span>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
};

export default BiometricAuthButton;
