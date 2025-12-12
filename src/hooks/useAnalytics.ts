import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  const trackClubView = useCallback(async (clubId: string) => {
    try {
      await supabase.rpc('increment_club_analytics', {
        p_club_id: clubId,
        p_field: 'views'
      });
    } catch (error) {
      console.error('Error tracking club view:', error);
    }
  }, []);

  const trackClubClick = useCallback(async (clubId: string) => {
    try {
      await supabase.rpc('increment_club_analytics', {
        p_club_id: clubId,
        p_field: 'clicks'
      });
    } catch (error) {
      console.error('Error tracking club click:', error);
    }
  }, []);

  const trackClubDirections = useCallback(async (clubId: string) => {
    try {
      await supabase.rpc('increment_club_analytics', {
        p_club_id: clubId,
        p_field: 'directions_clicks'
      });
    } catch (error) {
      console.error('Error tracking directions click:', error);
    }
  }, []);

  const trackClubShare = useCallback(async (clubId: string) => {
    try {
      await supabase.rpc('increment_club_analytics', {
        p_club_id: clubId,
        p_field: 'shares'
      });
    } catch (error) {
      console.error('Error tracking club share:', error);
    }
  }, []);

  const trackEventView = useCallback(async (eventId: string) => {
    try {
      await supabase.rpc('increment_event_analytics', {
        p_event_id: eventId,
        p_field: 'views'
      });
    } catch (error) {
      console.error('Error tracking event view:', error);
    }
  }, []);

  const trackEventClick = useCallback(async (eventId: string) => {
    try {
      await supabase.rpc('increment_event_analytics', {
        p_event_id: eventId,
        p_field: 'clicks'
      });
    } catch (error) {
      console.error('Error tracking event click:', error);
    }
  }, []);

  const trackEventRsvp = useCallback(async (eventId: string) => {
    try {
      await supabase.rpc('increment_event_analytics', {
        p_event_id: eventId,
        p_field: 'rsvps'
      });
    } catch (error) {
      console.error('Error tracking event RSVP:', error);
    }
  }, []);

  const trackEventShare = useCallback(async (eventId: string) => {
    try {
      await supabase.rpc('increment_event_analytics', {
        p_event_id: eventId,
        p_field: 'shares'
      });
    } catch (error) {
      console.error('Error tracking event share:', error);
    }
  }, []);

  const trackTicketSale = useCallback(async (eventId: string, revenueCents: number) => {
    try {
      // Track the sale
      await supabase.rpc('increment_event_analytics', {
        p_event_id: eventId,
        p_field: 'ticket_sales'
      });
      
      // Update revenue (separate call for now)
      const { data } = await supabase
        .from('event_analytics')
        .select('revenue_cents')
        .eq('event_id', eventId)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();
      
      if (data) {
        await supabase
          .from('event_analytics')
          .update({ revenue_cents: (data.revenue_cents || 0) + revenueCents })
          .eq('event_id', eventId)
          .eq('date', new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error tracking ticket sale:', error);
    }
  }, []);

  return {
    trackClubView,
    trackClubClick,
    trackClubDirections,
    trackClubShare,
    trackEventView,
    trackEventClick,
    trackEventRsvp,
    trackEventShare,
    trackTicketSale,
  };
};
