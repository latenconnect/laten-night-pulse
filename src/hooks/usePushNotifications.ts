import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Check if we're running in a Capacitor native environment
const isNative = () => {
  return Capacitor.isNativePlatform();
};

const getPlatform = () => {
  return Capacitor.getPlatform(); // 'ios', 'android', or 'web'
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative()) return;

    const initPushNotifications = async () => {
      try {
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
      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setFcmToken(token.value);

        if (user) {
          await saveTokenToDatabase(token.value);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        toast(notification.title || 'New Notification', {
          description: notification.body,
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        
        const data = action.notification.data;
        
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
      const platform = getPlatform();
      
      // Upsert token - update if exists, insert if new
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: platform,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const removeToken = async () => {
    if (!user || !fcmToken) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', fcmToken);

      if (error) {
        console.error('Error deactivating push token:', error);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
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
    removeToken,
    isNative: isNative(),
  };
};

export default usePushNotifications;
