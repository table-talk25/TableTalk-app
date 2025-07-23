import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';

function usePushPermission() {
  useEffect(() => {
    // Controlla se il permesso è già stato concesso
    PushNotifications.checkPermissions().then(status => {
      if (status.receive !== 'granted') {
        // Chiedi il permesso
        PushNotifications.requestPermissions().then(result => {
          if (result.receive === 'granted') {
            // Permesso concesso, registra il device
            PushNotifications.register();
          } else {
            // Permesso negato
            console.log('Notifiche disabilitate dall’utente');
          }
        });
      } else {
        // Permesso già concesso, registra il device
        PushNotifications.register();
      }
    });
  }, []);
}

export default usePushPermission; 