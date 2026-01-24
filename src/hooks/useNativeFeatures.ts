import { useEffect, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useHaptics } from './useHaptics';

// Detect native platform
export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    setPlatform(Capacitor.getPlatform() as 'ios' | 'android' | 'web');
  }, []);
  
  return {
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
    platform,
  };
};

// Native swipe-back gesture support
export const useSwipeBack = (onBack: () => void, threshold = 50) => {
  const { isNative } = useNativeFeatures();
  const { lightTap } = useHaptics();
  const [startX, setStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only trigger from left edge (first 20px)
    if (e.touches[0].clientX < 20) {
      setStartX(e.touches[0].clientX);
      setIsSwiping(true);
    }
  }, []);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    if (diff > threshold) {
      lightTap();
      onBack();
      setIsSwiping(false);
    }
  }, [isSwiping, startX, threshold, onBack, lightTap]);
  
  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
  }, []);
  
  useEffect(() => {
    if (!isNative) return;
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isNative, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return { isSwiping };
};

// Status bar management
export const useStatusBar = () => {
  const { isNative, isIOS } = useNativeFeatures();
  
  const setDarkContent = useCallback(async () => {
    if (!isNative) return;
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      if (isIOS) {
        await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
      }
    } catch (e) {
      console.log('StatusBar not available');
    }
  }, [isNative, isIOS]);
  
  const setLightContent = useCallback(async () => {
    if (!isNative) return;
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      console.log('StatusBar not available');
    }
  }, [isNative]);
  
  const hideStatusBar = useCallback(async () => {
    if (!isNative) return;
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.hide();
    } catch (e) {
      console.log('StatusBar not available');
    }
  }, [isNative]);
  
  const showStatusBar = useCallback(async () => {
    if (!isNative) return;
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.show();
    } catch (e) {
      console.log('StatusBar not available');
    }
  }, [isNative]);
  
  useEffect(() => {
    setDarkContent();
  }, [setDarkContent]);
  
  return { setDarkContent, setLightContent, hideStatusBar, showStatusBar };
};

// Keyboard management for forms
export const useKeyboard = () => {
  const { isNative } = useNativeFeatures();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    if (!isNative) return;
    
    const setupKeyboard = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        
        Keyboard.addListener('keyboardWillShow', info => {
          setKeyboardHeight(info.keyboardHeight);
          setIsKeyboardVisible(true);
        });
        
        Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        });
      } catch (e) {
        console.log('Keyboard plugin not available');
      }
    };
    
    setupKeyboard();
    
    return () => {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.removeAllListeners();
      }).catch(() => {});
    };
  }, [isNative]);
  
  const hideKeyboard = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch (e) {
      console.log('Keyboard hide failed');
    }
  }, [isNative]);
  
  return { keyboardHeight, isKeyboardVisible, hideKeyboard };
};

// App state management (foreground/background)
export const useAppState = (onResume?: () => void, onPause?: () => void) => {
  const { isNative } = useNativeFeatures();
  const [appState, setAppState] = useState<'active' | 'inactive' | 'background'>('active');
  
  useEffect(() => {
    if (!isNative) return;
    
    const setupAppState = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        App.addListener('appStateChange', state => {
          if (state.isActive) {
            setAppState('active');
            onResume?.();
          } else {
            setAppState('background');
            onPause?.();
          }
        });
      } catch (e) {
        console.log('App plugin not available');
      }
    };
    
    setupAppState();
    
    return () => {
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners();
      }).catch(() => {});
    };
  }, [isNative, onResume, onPause]);
  
  return { appState, isActive: appState === 'active' };
};
