export async function showAppNotification(
  title: string,
  options?: NotificationOptions,
): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    // Desktop browsers generally support the constructor; mobile Chrome does not.
    new Notification(title, options);
    return true;
  } catch (error) {
    console.warn('Notification could not be displayed:', error);
    return false;
  }
}