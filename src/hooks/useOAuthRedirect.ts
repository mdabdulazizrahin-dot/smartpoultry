import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { saveDriveToken } from '@/lib/googleDriveBackup';
import { toast } from 'sonner';

export const useOAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async (url: string) => {
      if (!url) return;

      // Close the in-app Chrome Custom Tab
      await Browser.close().catch(() => {});

      if (
        url.includes('com.smartpoultry.app') ||
        url.includes('auth') ||
        url.includes('access_token') ||
        url.includes('code=') ||
        url.includes('provider_token')
      ) {
        try {
          const isDriveConnect =
            localStorage.getItem('auth_redirect_purpose') === 'connect_drive';

          let providerToken: string | null = null;
          let expiresIn = 3500;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // 1. Handle Implicit Grant Flow (tokens in URL hash)
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
            providerToken = params.get('provider_token');
            if (params.get('expires_in')) {
              expiresIn = Number(params.get('expires_in')) || 3500;
            }
          }

          // Save provider token immediately if found in URL hash
          if (providerToken) {
            saveDriveToken(providerToken, expiresIn);
          }

          // 2. Handle PKCE Flow (authorization code in query string)
          const queryIndex = url.indexOf('?');
          let code: string | null = null;
          if (queryIndex !== -1) {
            const query = url.substring(queryIndex + 1).split('#')[0];
            const params = new URLSearchParams(query);
            code = params.get('code');
          }

          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Error exchanging code for session:', error);
              toast.error('অথোরাইজেশন ব্যর্থ হয়েছে: ' + error.message);
              return;
            }
            if (data?.session?.provider_token) {
              const exp =
                (data.session as unknown as { provider_token_expires_in?: number })
                  .provider_token_expires_in ?? 3500;
              saveDriveToken(data.session.provider_token, exp);
            }
          } else if (accessToken && refreshToken && !isDriveConnect) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Error setting Supabase session from hash:', error);
              toast.error('লগইন ব্যর্থ হয়েছে: ' + error.message);
              return;
            }
          }

          // If purpose was specifically to connect Google Drive:
          if (isDriveConnect) {
            localStorage.removeItem('auth_redirect_purpose');
            const preSessionRaw = localStorage.getItem('pre_drive_connect_session');
            if (preSessionRaw) {
              try {
                const preSession = JSON.parse(preSessionRaw);
                if (preSession.access_token && preSession.refresh_token) {
                  await supabase.auth.setSession({
                    access_token: preSession.access_token,
                    refresh_token: preSession.refresh_token,
                  });
                }
              } catch (err) {
                console.error('Error restoring pre-drive session:', err);
              } finally {
                localStorage.removeItem('pre_drive_connect_session');
              }
            } else {
              // User was a guest before connecting drive; maintain guest state
              await supabase.auth.signOut().catch(() => {});
            }

            window.dispatchEvent(new Event('drive_connection_changed'));
            toast.success('Google Drive সফলভাবে কানেক্ট হয়েছে! ☁️');

            if (window.history?.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            navigate('/', { replace: true });
            return;
          }

          // Otherwise normal Google Sign In
          window.dispatchEvent(new Event('drive_connection_changed'));
          toast.success('Google দিয়ে সফলভাবে লগইন হয়েছে');
          if (window.history?.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          navigate('/', { replace: true });
        } catch (err: any) {
          console.error('Unexpected error in OAuth redirect handler:', err);
        }
      }
    };

    // For Android native deep links
    if (Capacitor.isNativePlatform()) {
      const listenerPromise = App.addListener('appUrlOpen', (data: { url: string }) => {
        handleAuthRedirect(data.url);
      });

      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    } else {
      // For web redirect
      const currentUrl = window.location.href;
      if (
        currentUrl.includes('access_token') ||
        currentUrl.includes('code=') ||
        currentUrl.includes('provider_token')
      ) {
        handleAuthRedirect(currentUrl);
      }
    }
  }, [navigate]);
};
