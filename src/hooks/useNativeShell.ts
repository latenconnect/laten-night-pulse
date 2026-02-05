import { useState, useEffect } from 'react';

/**
 * Detects if the app is running inside the native iOS shell (WKWebView)
 * The native shell will inject a flag to indicate it's handling auth natively
 */
export const useNativeShell = () => {
  const [isNativeShell, setIsNativeShell] = useState(false);
  const [isNativeAuthEnabled, setIsNativeAuthEnabled] = useState(false);

  useEffect(() => {
    // Check for native shell indicators
    const checkNativeShell = () => {
      const w = window as any;
      
      // Check if running in WKWebView with native auth handling
      // The native shell will set window.LatenNativeShell = true
      const hasNativeShellFlag = w.LatenNativeShell === true;
      
      // Check for webkit message handlers (indicates WKWebView)
      const hasWebkitHandlers = !!(w.webkit?.messageHandlers);
      
      // Check if native auth is enabled (native shell handles Apple Sign-In, Face ID, etc.)
      const nativeAuthEnabled = w.LatenNativeAuth === true;
      
      setIsNativeShell(hasNativeShellFlag || (hasWebkitHandlers && nativeAuthEnabled));
      setIsNativeAuthEnabled(nativeAuthEnabled);
    };

    // Check immediately
    checkNativeShell();

    // Also listen for the native shell to announce itself
    const handleNativeReady = () => {
      checkNativeShell();
    };

    window.addEventListener('laten-native-ready', handleNativeReady);
    
    // Re-check after a short delay in case native shell sets flags after load
    const timeout = setTimeout(checkNativeShell, 100);

    return () => {
      window.removeEventListener('laten-native-ready', handleNativeReady);
      clearTimeout(timeout);
    };
  }, []);

  return {
    isNativeShell,
    isNativeAuthEnabled,
  };
};

// Type declarations for native bridge
declare global {
  interface Window {
    LatenNativeShell?: boolean;
    LatenNativeAuth?: boolean;
    webkit?: {
      messageHandlers?: {
        latenAuth?: {
          postMessage: (message: any) => void;
        };
        latenSession?: {
          postMessage: (message: any) => void;
        };
      };
    };
  }
}

export default useNativeShell;
