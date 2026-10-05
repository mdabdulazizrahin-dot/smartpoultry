import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let lastBackPress = 0;

    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // 1. If any modal / dialog / sheet / alert-dialog is open, close it first
      const openDialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (openDialog) {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
        });
        document.dispatchEvent(escEvent);
        return;
      }

      // 2. If user is on a sub-route (e.g. /auth), navigate back
      if (location.pathname !== '/' && canGoBack) {
        navigate(-1);
        return;
      }

      // 3. If on home root, double press back within 2s to exit cleanly
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress = now;
      }
    });

    return () => {
      backListener.then((handle) => handle.remove());
    };
  }, [navigate, location]);
}
