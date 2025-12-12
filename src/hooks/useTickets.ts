import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  quantity_total: number;
  quantity_sold: number;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}

export interface TicketPurchase {
  id: string;
  ticket_id: string;
  user_id: string;
  status: 'available' | 'sold' | 'used' | 'refunded' | 'cancelled';
  qr_code: string;
  price_paid_cents: number;
  commission_cents: number;
  purchased_at: string;
  used_at: string | null;
  ticket?: EventTicket;
  event?: {
    id: string;
    name: string;
    start_time: string;
    location_name: string;
    cover_image: string | null;
  };
}

const COMMISSION_RATE = 0.05; // 5% commission

export const useEventTickets = (eventId?: string) => {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('price_cents', { ascending: true });

      if (error) throw error;
      setTickets((data as EventTicket[]) || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, refetch: fetchTickets };
};

export const useMyTickets = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          ticket:event_tickets(
            *,
            event:events(id, name, start_time, location_name, cover_image)
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the nested structure
      const formatted = (data || []).map((p: any) => ({
        ...p,
        event: p.ticket?.event,
        ticket: p.ticket ? { ...p.ticket, event: undefined } : undefined,
      }));
      
      setPurchases(formatted as TicketPurchase[]);
    } catch (error) {
      console.error('Error fetching my tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyTickets();
  }, [fetchMyTickets]);

  return { purchases, loading, refetch: fetchMyTickets };
};

export const usePurchaseTicket = () => {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(false);

  const purchaseTicket = useCallback(async (
    ticketId: string,
    priceCents: number
  ): Promise<{ success: boolean; purchase?: TicketPurchase }> => {
    if (!user) {
      toast.error('Please sign in to purchase tickets');
      return { success: false };
    }

    setPurchasing(true);
    try {
      const commissionCents = Math.round(priceCents * COMMISSION_RATE);
      
      const { data, error } = await supabase
        .from('ticket_purchases')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          price_paid_cents: priceCents,
          commission_cents: commissionCents,
        })
        .select()
        .single();

      if (error) throw error;

      // Update quantity sold
      await supabase
        .from('event_tickets')
        .update({ quantity_sold: supabase.rpc ? 1 : 1 }) // Will be updated by trigger
        .eq('id', ticketId);

      toast.success('Ticket purchased successfully!');
      return { success: true, purchase: data as TicketPurchase };
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      toast.error(error.message || 'Failed to purchase ticket');
      return { success: false };
    } finally {
      setPurchasing(false);
    }
  }, [user]);

  return { purchaseTicket, purchasing };
};

export const useCreateTicket = () => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createTicket = useCallback(async (
    eventId: string,
    ticketData: {
      name: string;
      description?: string;
      price_cents: number;
      quantity_total: number;
      sale_starts_at?: string;
      sale_ends_at?: string;
    }
  ): Promise<{ success: boolean; ticket?: EventTicket }> => {
    if (!user) {
      toast.error('Please sign in to create tickets');
      return { success: false };
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ...ticketData,
          currency: 'EUR',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ticket type created!');
      return { success: true, ticket: data as EventTicket };
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.message || 'Failed to create ticket');
      return { success: false };
    } finally {
      setCreating(false);
    }
  }, [user]);

  return { createTicket, creating };
};
