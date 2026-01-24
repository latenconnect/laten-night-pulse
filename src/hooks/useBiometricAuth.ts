import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export type BiometricType = 'face' | 'fingerprint' | 'none';

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [loading, setLoading] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  
  // Check biometric availability
  const checkAvailability = useCallback(async () => {
    if (!isNative) {
      setIsAvailable(false);
      return false;
    }
    
    try {
      // Use NativeBiometric plugin for Capacitor
      const { NativeBiometric } = await import('capacitor-native-biometric');
      const result = await NativeBiometric.isAvailable();
      
      setIsAvailable(result.isAvailable);
      
      if (result.biometryType === 1) { // FACE_ID
        setBiometricType('face');
      } else if (result.biometryType === 2) { // TOUCH_ID / FINGERPRINT
        setBiometricType('fingerprint');
      } else {
        setBiometricType('none');
      }
      
      return result.isAvailable;
    } catch (e) {
      console.log('Biometric check failed:', e);
      setIsAvailable(false);
      return false;
    }
  }, [isNative]);
  
  // Authenticate with biometrics
  const authenticate = useCallback(async (reason = 'Authenticate to continue'): Promise<boolean> => {
    if (!isNative || !isAvailable) return false;
    
    setLoading(true);
    
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Laten',
        subtitle: 'Sign in with biometrics',
        description: reason,
      });
      
      setLoading(false);
      return true;
    } catch (e: any) {
      setLoading(false);
      
      // User cancelled - not an error
      if (e?.code === 'userCancel' || e?.message?.includes('cancel')) {
        return false;
      }
      
      console.log('Biometric auth failed:', e);
      return false;
    }
  }, [isNative, isAvailable]);
  
  // Store credentials securely
  const storeCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!isNative) return false;
    
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      await NativeBiometric.setCredentials({
        username,
        password,
        server: 'latenapp.com',
      });
      
      return true;
    } catch (e) {
      console.log('Store credentials failed:', e);
      return false;
    }
  }, [isNative]);
  
  // Retrieve stored credentials
  const getCredentials = useCallback(async (): Promise<{ username: string; password: string } | null> => {
    if (!isNative) return null;
    
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      const credentials = await NativeBiometric.getCredentials({
        server: 'latenapp.com',
      });
      
      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (e) {
      console.log('Get credentials failed:', e);
      return null;
    }
  }, [isNative]);
  
  // Delete stored credentials
  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      
      await NativeBiometric.deleteCredentials({
        server: 'latenapp.com',
      });
      
      return true;
    } catch (e) {
      console.log('Delete credentials failed:', e);
      return false;
    }
  }, [isNative]);
  
  // Get biometric type label
  const getBiometricLabel = useCallback(() => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Touch ID';
      default:
        return 'Biometrics';
    }
  }, [biometricType]);
  
  return {
    isAvailable,
    biometricType,
    loading,
    checkAvailability,
    authenticate,
    storeCredentials,
    getCredentials,
    deleteCredentials,
    getBiometricLabel,
    isNative,
  };
};
