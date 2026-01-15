import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component to handle deep links from OAuth callbacks in native iOS/Android apps.
 * This is required for Sign in with Apple and other OAuth providers to work
 * correctly on native platforms.
 */
const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Capacitor is available
    const isCapacitorAvailable = 
      typeof window !== 'undefined' && 
      window.hasOwnProperty('Capacitor') && 
      (window as any).Capacitor;

    if (!isCapacitorAvailable) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      try {
        const parsedUrl = new URL(url);
        
        // Handle OAuth callback
        if (parsedUrl.protocol === 'laten:' && parsedUrl.host === 'auth') {
          // Extract tokens from the URL hash fragment
          const hash = parsedUrl.hash?.substring(1) || '';
          const searchParams = parsedUrl.search?.substring(1) || '';
          const params = new URLSearchParams(hash || searchParams);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const error = params.get('error');
          const errorDescription = params.get('error_description');

          if (error) {
            console.error('OAuth error:', error, errorDescription);
            navigate('/auth?error=' + encodeURIComponent(errorDescription || error));
            return;
          }

          if (accessToken && refreshToken) {
            console.log('Setting session from deep link');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              navigate('/auth?error=' + encodeURIComponent('Failed to complete sign in'));
            } else {
              console.log('Session set successfully from deep link');
              navigate('/');
            }
          } else {
            // Check if there's a code for PKCE flow
            const code = params.get('code');
            if (code) {
              console.log('Exchanging code for session');
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              
              if (exchangeError) {
                console.error('Error exchanging code:', exchangeError);
                navigate('/auth?error=' + encodeURIComponent('Failed to complete sign in'));
              } else {
                console.log('Code exchanged successfully');
                navigate('/');
              }
            }
          }
        }
        
        // Handle other deep links (e.g., event details, profiles)
        if (parsedUrl.protocol === 'laten:') {
          const path = parsedUrl.pathname;
          if (path && path !== '/' && !path.includes('auth')) {
            navigate(path);
          }
        }
      } catch (parseError) {
        console.error('Error parsing deep link URL:', parseError);
      }
    };

    const setupDeepLinkListener = async () => {
      try {
        // Dynamically import Capacitor App plugin only in native environment
        const CapacitorApp = await import('@capacitor/app').catch(() => null);
        
        if (!CapacitorApp?.App) {
          console.log('Capacitor App plugin not available');
          return;
        }

        const { App } = CapacitorApp;

        // Handle app URL open events (deep links)
        const listener = await App.addListener('appUrlOpen', (event: { url: string }) => {
          handleDeepLink(event.url);
        });

        cleanup = () => {
          listener.remove();
        };
      } catch (error) {
        console.log('Deep link handler setup error:', error);
      }
    };

    setupDeepLinkListener();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;