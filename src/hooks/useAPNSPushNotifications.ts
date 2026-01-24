import { useEffect, useCallback, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// APNs Push Notification Hook - Direct integration without OneSignal
export const useAPNSPushNotifications = () => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const listenerRef = useRef<any>(null);
  
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Save token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!user?.id) return false;
    
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: platform === 'ios' ? 'ios' : 'android',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform',
        });
      
      if (error) {
        console.error('[APNs] Failed to save token:', error);
        return false;
      }
      
      console.log('[APNs] Token saved successfully');
      return true;
    } catch (err) {
      console.error('[APNs] Error saving token:', err);
      return false;
    }
  }, [user?.id, platform]);

  // Initialize push notifications
  useEffect(() => {
    if (!isNative) {
      setIsInitialized(true);
      return;
    }

    const initPush = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Check current permission status
        const permResult = await PushNotifications.checkPermissions();
        setPermissionStatus(permResult.receive as 'granted' | 'denied' | 'prompt');
        
        // Add listeners
        const registrationListener = await PushNotifications.addListener('registration', (token) => {
          console.log('[APNs] Registration token:', token.value);
          setDeviceToken(token.value);
          saveTokenToDatabase(token.value);
        });
        
        const errorListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('[APNs] Registration error:', error);
        });
        
        const notificationListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[APNs] Push received:', notification);
          // Handle foreground notification - could show a toast or in-app notification
        });
        
        const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[APNs] Push action:', notification);
          // Handle notification tap - navigate to relevant screen
          const data = notification.notification.data;
          if (data?.event_id) {
            window.location.href = `/event/${data.event_id}`;
          } else if (data?.user_id) {
            window.location.href = `/user/${data.user_id}`;
          }
        });
        
        listenerRef.current = {
          registration: registrationListener,
          error: errorListener,
          notification: notificationListener,
          action: actionListener,
        };
        
        // If already granted, register
        if (permResult.receive === 'granted') {
          await PushNotifications.register();
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('[APNs] Init error:', err);
        setIsInitialized(true);
      }
    };
    
    initPush();
    
    return () => {
      if (listenerRef.current) {
        Object.values(listenerRef.current).forEach((listener: any) => {
          listener?.remove?.();
        });
      }
    };
  }, [isNative, saveTokenToDatabase]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const permResult = await PushNotifications.requestPermissions();
      setPermissionStatus(permResult.receive as 'granted' | 'denied' | 'prompt');
      
      if (permResult.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[APNs] Permission request error:', err);
      return false;
    }
  }, [isNative]);

  // Deactivate token
  const removeToken = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', platform === 'ios' ? 'ios' : 'android');
      
      setDeviceToken(null);
      console.log('[APNs] Token deactivated');
    } catch (err) {
      console.error('[APNs] Error deactivating token:', err);
    }
  }, [user?.id, platform]);

  return {
    permissionStatus,
    deviceToken,
    isInitialized,
    isNative,
    requestPermission,
    removeToken,
  };
};

export default useAPNSPushNotifications;
