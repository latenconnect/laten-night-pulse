import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// AdMob Configuration
const ADMOB_CONFIG = {
  appId: {
    ios: 'ca-app-pub-4192366585858201~8396389324',
    android: 'ca-app-pub-4192366585858201~8396389324', // Add Android ID when available
  },
  adUnits: {
    nativeAdvanced: {
      ios: 'ca-app-pub-4192366585858201/5071210220',
      android: 'ca-app-pub-4192366585858201/5071210220', // Add Android ID when available
    },
  },
};

interface AdMobState {
  isInitialized: boolean;
  isNativeSupported: boolean;
}

export const useAdMob = () => {
  const [state, setState] = useState<AdMobState>({
    isInitialized: false,
    isNativeSupported: false,
  });

  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  useEffect(() => {
    const initializeAdMob = async () => {
      if (!isNativePlatform) {
        // Web fallback - show placeholder ads
        setState({
          isInitialized: true,
          isNativeSupported: false,
        });
        return;
      }

      try {
        const { AdMob } = await import('@capacitor-community/admob');
        
        await AdMob.initialize({
          initializeForTesting: __DEV__ || false,
        });

        setState({
          isInitialized: true,
          isNativeSupported: true,
        });
      } catch (error) {
        console.warn('AdMob initialization failed:', error);
        setState({
          isInitialized: true,
          isNativeSupported: false,
        });
      }
    };

    initializeAdMob();
  }, [isNativePlatform]);

  const getNativeAdUnitId = useCallback(() => {
    if (platform === 'ios') {
      return ADMOB_CONFIG.adUnits.nativeAdvanced.ios;
    }
    return ADMOB_CONFIG.adUnits.nativeAdvanced.android;
  }, [platform]);

  return {
    ...state,
    platform,
    isNativePlatform,
    getNativeAdUnitId,
    config: ADMOB_CONFIG,
  };
};

// Helper to check if we're in development mode
const __DEV__ = import.meta.env.DEV;

// Ad frequency helpers
export const shouldShowAd = (index: number, frequency: number = 5): boolean => {
  // Show ad every N items, starting after the first few items
  return index > 2 && (index + 1) % frequency === 0;
};

export const insertAdsIntoList = <T>(
  items: T[],
  frequency: number = 5
): (T | { type: 'ad'; index: number })[] => {
  const result: (T | { type: 'ad'; index: number })[] = [];
  let adCount = 0;

  items.forEach((item, index) => {
    result.push(item);
    
    if (shouldShowAd(index, frequency)) {
      result.push({ type: 'ad', index: adCount++ });
    }
  });

  return result;
};
