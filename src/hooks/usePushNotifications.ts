import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if we're running in a Capacitor native environment
const isNative = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative()) return;

    const initPushNotifications = async () => {
      try {
        // Check current permission status
        const permStatus = await PushNotifications.checkPermissions();
        setPermissionStatus(permStatus.receive as 'prompt' | 'granted' | 'denied');

        if (permStatus.receive === 'granted') {
          await registerPushNotifications();
        }
      } catch (error) {
        console.log('Push notifications not available:', error);
      }
    };

    initPushNotifications();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isNative()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    try {
      const permStatus = await PushNotifications.requestPermissions();
      setPermissionStatus(permStatus.receive as 'prompt' | 'granted' | 'denied');

      if (permStatus.receive === 'granted') {
        await registerPushNotifications();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  const registerPushNotifications = async () => {
    try {
      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setFcmToken(token.value);

        // Save token to database if user is logged in
        if (user) {
          await saveTokenToDatabase(token.value);
        }
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Listen for incoming notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        
        // Show a toast for foreground notifications
        toast(notification.title || 'New Notification', {
          description: notification.body,
        });
      });

      // Listen for notification taps
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        
        const data = action.notification.data;
        
        // Handle navigation based on notification type
        if (data?.type === 'event_reminder' && data?.eventId) {
          window.location.href = `/event/${data.eventId}`;
        } else if (data?.type === 'rsvp_update' && data?.eventId) {
          window.location.href = `/event/${data.eventId}`;
        } else if (data?.type === 'new_event') {
          window.location.href = '/explore';
        }
      });
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  };

  const saveTokenToDatabase = async (token: string) => {
    if (!user) return;

    try {
      // You would need to create a push_tokens table in your database
      // For now, we'll log it - implement the actual save when you create the table
      console.log('Would save FCM token to database:', token, 'for user:', user.id);
      
      // Example implementation:
      // await supabase.from('push_tokens').upsert({
      //   user_id: user.id,
      //   token: token,
      //   platform: Capacitor.getPlatform(),
      //   updated_at: new Date().toISOString()
      // }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  // Save token when user logs in
  useEffect(() => {
    if (user && fcmToken) {
      saveTokenToDatabase(fcmToken);
    }
  }, [user, fcmToken]);

  return {
    permissionStatus,
    fcmToken,
    requestPermission,
    isNative: isNative(),
  };
};

export default usePushNotifications;
