import { useMemo } from 'react';

interface PlatformInfo {
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  platform: 'ios' | 'android' | 'web';
}

/**
 * Hook to detect the current platform (iOS native, Android native, or web)
 * Used to adjust payment flows - iOS native apps cannot use Stripe directly
 */
export const usePlatform = (): PlatformInfo => {
  return useMemo(() => {
    const capacitor = (window as any).Capacitor;
    const isNative = !!capacitor?.isNativePlatform?.();
    const platformName = capacitor?.getPlatform?.() || 'web';
    
    return {
      isNative,
      isIOS: isNative && platformName === 'ios',
      isAndroid: isNative && platformName === 'android',
      isWeb: !isNative || platformName === 'web',
      platform: platformName as 'ios' | 'android' | 'web',
    };
  }, []);
};

export default usePlatform;
