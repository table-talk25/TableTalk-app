import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

function usePushPermission() {
  useEffect(() => {
    // Controlla se siamo su un dispositivo mobile nativo
    const isNativePlatform = Capacitor.isNativePlatform();
    
    if (!isNativePlatform) {
      console.log('PushNotifications non disponibili su web');
      return;
    }

    const initializePushNotifications = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Controlla se il permesso è già stato concesso
        const status = await PushNotifications.checkPermissions();
        if (status.receive !== 'granted') {
          // Chiedi il permesso
          const result = await PushNotifications.requestPermissions();
          if (result.receive === 'granted') {
            // Permesso concesso, registra il device
            await PushNotifications.register();
          } else {
            // Permesso negato
            console.log('Notifiche disabilitate dall\'utente');
          }
        } else {
          // Permesso già concesso, registra il device
          await PushNotifications.register();
        }
      } catch (error) {
        console.log('PushNotifications non disponibili:', error.message);
      }
    };

    initializePushNotifications();
  }, []);
}

export default usePushPermission; 