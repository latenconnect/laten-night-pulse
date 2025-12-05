import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface VerificationSession {
  session_id: string;
  url: string;
}

export const useAgeVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const startVerification = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to verify your age');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<VerificationSession>('didit-session', {
        body: {
          callback_url: `https://huigwbyctzjictnaycjj.supabase.co/functions/v1/didit-webhook`,
        },
      });

      if (fnError) {
        console.error('Error starting verification:', fnError);
        throw fnError;
      }

      if (data?.url) {
        setVerificationUrl(data.url);
        return data;
      }

      throw new Error('No verification URL returned');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start verification';
      setError(message);
      console.error('Age verification error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkVerificationStatus = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('age_verified, age_verified_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking verification status:', error);
        return false;
      }

      return data?.age_verified === true;
    } catch (err) {
      console.error('Error checking verification:', err);
      return false;
    }
  }, [user]);

  return {
    loading,
    error,
    verificationUrl,
    startVerification,
    checkVerificationStatus,
  };
};
