import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type ClubVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ClubClaim {
  id: string;
  club_id: string;
  user_id: string;
  status: ClubVerificationStatus;
  business_name: string;
  business_email_encrypted: string | null;
  business_phone_encrypted: string | null;
  verification_documents: string[] | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export const useClubClaim = (clubId?: string) => {
  const { user } = useAuth();
  const [claim, setClaim] = useState<ClubClaim | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClaim = useCallback(async () => {
    if (!clubId || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('club_claims')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching claim:', error);
      }
      
      setClaim(data as ClubClaim | null);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [clubId, user]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  const submitClaim = useCallback(async (
    claimData: {
      business_name: string;
      business_email_encrypted: string;
      business_phone_encrypted?: string;
    }
  ): Promise<boolean> => {
    if (!user || !clubId) {
      toast.error('Please sign in to claim this venue');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('club_claims')
        .insert({
          club_id: clubId,
          user_id: user.id,
          business_name: claimData.business_name,
          business_email_encrypted: claimData.business_email_encrypted,
          business_phone_encrypted: claimData.business_phone_encrypted || null,
        })
        .select()
        .single();

      if (error) throw error;

      setClaim(data as ClubClaim);
      toast.success('Claim submitted! We\'ll review it within 24-48 hours.');
      return true;
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      toast.error(error.message || 'Failed to submit claim');
      return false;
    }
  }, [clubId, user]);

  return {
    claim,
    loading,
    submitClaim,
    isPending: claim?.status === 'pending',
    isVerified: claim?.status === 'verified',
    isRejected: claim?.status === 'rejected',
    refetch: fetchClaim,
  };
};

export const useAdminClubClaims = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<(ClubClaim & { club?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('club_claims')
        .select(`
          *,
          club:clubs(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const reviewClaim = useCallback(async (
    claimId: string,
    status: 'verified' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: claimData, error: fetchError } = await supabase
        .from('club_claims')
        .select('club_id, user_id')
        .eq('id', claimId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('club_claims')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', claimId);

      if (error) throw error;

      // If approved, update club owner
      if (status === 'verified' && claimData) {
        await supabase
          .from('clubs')
          .update({ owner_id: claimData.user_id })
          .eq('id', claimData.club_id);
      }

      toast.success(`Claim ${status === 'verified' ? 'approved' : 'rejected'}!`);
      fetchClaims();
      return true;
    } catch (error: any) {
      console.error('Error reviewing claim:', error);
      toast.error(error.message || 'Failed to review claim');
      return false;
    }
  }, [user, fetchClaims]);

  return {
    claims,
    loading,
    reviewClaim,
    refetch: fetchClaims,
  };
};
