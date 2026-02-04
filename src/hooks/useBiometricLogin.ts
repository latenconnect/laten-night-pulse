import { useState, useCallback, useEffect } from 'react';
import { useBiometricAuth } from './useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to manage biometric login flow with credential storage
 * Integrates Face ID/Touch ID with Supabase authentication
 */
export const useBiometricLogin = () => {
  const {
    isAvailable,
    biometricType,
    loading: biometricLoading,
    checkAvailability,
    authenticate,
    storeCredentials,
    getCredentials,
    deleteCredentials,
    getBiometricLabel,
    isNative,
  } = useBiometricAuth();

  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize and check for stored credentials
  useEffect(() => {
    const init = async () => {
      if (!isNative) {
        setInitialized(true);
        return;
      }

      try {
        const available = await checkAvailability();
        
        if (available) {
          // Check if we have stored credentials
          const creds = await getCredentials();
          setHasStoredCredentials(!!creds);
        }
      } catch (e) {
        console.log('Biometric init error:', e);
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [isNative, checkAvailability, getCredentials]);

  /**
   * Perform biometric login using stored credentials
   */
  const performBiometricLogin = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !hasStoredCredentials) {
      return false;
    }

    setLoading(true);

    try {
      // First, verify identity with biometrics
      const authenticated = await authenticate('Sign in to Laten');
      
      if (!authenticated) {
        setLoading(false);
        return false;
      }

      // Get stored credentials
      const credentials = await getCredentials();
      
      if (!credentials) {
        toast.error('No saved credentials found. Please sign in with your password.');
        setLoading(false);
        return false;
      }

      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password,
      });

      if (error) {
        // Credentials might be outdated
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Saved credentials are no longer valid. Please sign in again.');
          await deleteCredentials();
          setHasStoredCredentials(false);
        } else {
          toast.error('Sign in failed. Please try again.');
        }
        setLoading(false);
        return false;
      }

      toast.success(`Welcome back!`);
      setLoading(false);
      return true;
    } catch (e) {
      console.log('Biometric login error:', e);
      toast.error('Biometric sign in failed. Please try again.');
      setLoading(false);
      return false;
    }
  }, [isAvailable, hasStoredCredentials, authenticate, getCredentials, deleteCredentials]);

  /**
   * Save credentials after successful email/password login
   */
  const saveCredentialsForBiometric = useCallback(async (
    email: string,
    password: string
  ): Promise<boolean> => {
    if (!isNative || !isAvailable) {
      return false;
    }

    try {
      // Prompt for biometric enrollment
      const authenticated = await authenticate(`Enable ${getBiometricLabel()} for future sign-ins`);
      
      if (!authenticated) {
        return false;
      }

      const stored = await storeCredentials(email, password);
      
      if (stored) {
        setHasStoredCredentials(true);
        toast.success(`${getBiometricLabel()} enabled for quick sign-in!`);
        return true;
      }
      
      return false;
    } catch (e) {
      console.log('Save credentials error:', e);
      return false;
    }
  }, [isNative, isAvailable, authenticate, storeCredentials, getBiometricLabel]);

  /**
   * Remove stored biometric credentials
   */
  const removeBiometricCredentials = useCallback(async (): Promise<boolean> => {
    try {
      const success = await deleteCredentials();
      if (success) {
        setHasStoredCredentials(false);
        toast.success(`${getBiometricLabel()} sign-in disabled`);
      }
      return success;
    } catch (e) {
      console.log('Remove credentials error:', e);
      return false;
    }
  }, [deleteCredentials, getBiometricLabel]);

  return {
    // State
    isAvailable,
    hasStoredCredentials,
    biometricType,
    loading: loading || biometricLoading,
    initialized,
    isNative,
    
    // Actions
    performBiometricLogin,
    saveCredentialsForBiometric,
    removeBiometricCredentials,
    getBiometricLabel,
  };
};

export default useBiometricLogin;
