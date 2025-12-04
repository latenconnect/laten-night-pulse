import { useEffect, useState, useCallback } from 'react';
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

// OneSignal will be available on window after plugin initialization
declare global {
  interface Window {
    plugins?: {
      OneSignal?: any;
    };
  }
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const saveTokenToDatabase = useCallback(async (token: string) => {
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
  }, [user]);

  const initOneSignal = useCallback(async () => {
    if (!isNative() || isInitialized) return;

    try {
      // OneSignal App ID from environment or hardcoded for native apps
      const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID;
      
      if (!oneSignalAppId) {
        console.log('OneSignal App ID not configured');
        return;
      }

      // Wait for Cordova/Capacitor to be ready
      document.addEventListener('deviceready', () => {
        const OneSignal = window.plugins?.OneSignal;
        
        if (!OneSignal) {
          console.log('OneSignal plugin not available');
          return;
        }

        // Initialize OneSignal
        OneSignal.initialize(oneSignalAppId);

        // Handle notification received while app is in foreground
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          console.log('Notification received:', event.notification);
          const notification = event.notification;
          toast(notification.title || 'New Notification', {
            description: notification.body,
          });
          // Allow notification to display
          event.preventDefault();
          event.notification.display();
        });

        // Handle notification clicked
        OneSignal.Notifications.addEventListener('click', (event: any) => {
          console.log('Notification clicked:', event);
          const data = event.notification.additionalData;
          
          if (data?.type === 'event_reminder' && data?.eventId) {
            window.location.href = `/event/${data.eventId}`;
          } else if (data?.type === 'rsvp_update' && data?.eventId) {
            window.location.href = `/event/${data.eventId}`;
          } else if (data?.type === 'new_event') {
            window.location.href = '/explore';
          }
        });

        // Check permission status
        OneSignal.Notifications.getPermissionAsync().then((granted: boolean) => {
          setPermissionStatus(granted ? 'granted' : 'prompt');
        });

        // Get player ID (subscription ID)
        OneSignal.User.getOnesignalId().then((id: string | null) => {
          if (id) {
            console.log('OneSignal Player ID:', id);
            setPlayerId(id);
          }
        });

        setIsInitialized(true);
      }, false);

    } catch (error) {
      console.log('OneSignal initialization error:', error);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isNative()) {
      initOneSignal();
    }
  }, [initOneSignal]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isNative()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    try {
      const OneSignal = window.plugins?.OneSignal;
      
      if (!OneSignal) {
        console.log('OneSignal not initialized');
        return false;
      }

      // Request permission
      const granted = await OneSignal.Notifications.requestPermission(true);
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        // Get player ID after permission granted
        const id = await OneSignal.User.getOnesignalId();
        if (id) {
          setPlayerId(id);
          await saveTokenToDatabase(id);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  const removeToken = async () => {
    if (!user || !playerId) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', playerId);

      if (error) {
        console.error('Error deactivating push token:', error);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  };

  // Save token when user logs in and we have a player ID
  useEffect(() => {
    if (user && playerId) {
      saveTokenToDatabase(playerId);
    }
  }, [user, playerId, saveTokenToDatabase]);

  return {
    permissionStatus,
    playerId,
    fcmToken: playerId, // Alias for backward compatibility
    requestPermission,
    removeToken,
    isNative: isNative(),
  };
};

export default usePushNotifications;
