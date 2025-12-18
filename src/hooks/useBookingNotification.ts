import { supabase } from '@/integrations/supabase/client';

interface BookingNotificationData {
  type: 'dj_booking' | 'bartender_booking';
  professionalUserId: string;
  professionalName: string;
  bookerName: string;
  eventDate: string;
  eventType: string;
  eventLocation?: string;
}

export const sendBookingNotification = async (data: BookingNotificationData) => {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-booking-notification', {
      body: data,
    });

    if (error) {
      console.error('Failed to send booking notification:', error);
      return { success: false, error };
    }

    console.log('Booking notification result:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending booking notification:', error);
    return { success: false, error };
  }
};
