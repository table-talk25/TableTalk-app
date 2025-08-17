// File: FRONTEND/client/src/utils/sentryTest.js
// 🧪 TEST SEMPLICE PER SENTRY
import * as Sentry from '@sentry/react';
import { useTranslation } from 'react-i18next';

export const useSentryTest = () => {
  const { t } = useTranslation();

  const testSentryConnection = () => {
    try {
      console.log('🧪 [Sentry Test] Avvio test di connessione...');
      if (!Sentry.getCurrentHub().getClient()) {
        console.warn('⚠️ [Sentry Test] Sentry non è inizializzato');
        return { success: false, error: t('sentry.notInitialized') };
      }
      const eventId = Sentry.captureMessage(t('sentry.testMessage'), 'info', { 
        tags: { 
          test: 'connection', 
          component: 'SentryTest',
          timestamp: new Date().toISOString()
        },
        extra: {
          environment: process.env.NODE_ENV,
          version: process.env.REACT_APP_VERSION || '1.0.0'
        }
      });
      console.log('✅ [Sentry Test] Test di connessione completato con successo');
      console.log('🆔 [Sentry Test] Event ID:', eventId);
      return { success: true, eventId };
    } catch (error) {
      console.error('❌ [Sentry Test] Errore durante il test:', error);
      return { success: false, error: error.message };
    }
  };

  const testErrorCapture = () => {
    try {
      console.log('🧪 [Sentry Test] Avvio test cattura errori...');
      const testError = new Error(t('sentry.testError'));
      testError.name = 'TestError';
      const eventId = Sentry.captureException(testError, { 
        tags: { 
          test: 'error_capture', 
          component: 'SentryTest',
          timestamp: new Date().toISOString()
        },
        extra: {
          environment: process.env.NODE_ENV,
          version: process.env.REACT_APP_VERSION || '1.0.0'
        }
      });
      console.log('✅ [Sentry Test] Test cattura errori completato con successo');
      console.log('🆔 [Sentry Test] Event ID:', eventId);
      return { success: true, eventId };
    } catch (error) {
      console.error('❌ [Sentry Test] Errore durante il test di cattura:', error);
      return { success: false, error: error.message };
    }
  };

  const testEnvironmentConfig = () => {
    try {
      console.log('🧪 [Sentry Test] Verifica configurazione ambiente...');
      const config = {
        dsn: process.env.REACT_APP_SENTRY_DSN ? 'Configured' : 'Not configured',
        environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || '1.0.0',
        debug: process.env.REACT_APP_DEBUG === 'true',
        errorMonitoring: process.env.REACT_APP_ENABLE_ERROR_MONITORING === 'true'
      };
      console.log('📋 [Sentry Test] Configurazione ambiente:', config);
      const isValid = config.dsn === 'Configured' && config.environment;
      if (isValid) { 
        console.log('✅ [Sentry Test] Configurazione ambiente valida'); 
      } else { 
        console.warn('⚠️ [Sentry Test] Configurazione ambiente incompleta'); 
      }
      return { success: isValid, config };
    } catch (error) {
      console.error('❌ [Sentry Test] Errore durante la verifica configurazione:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    testConnection: testSentryConnection,
    testErrorCapture: testErrorCapture,
    testEnvironment: testEnvironmentConfig
  };
};

// Versione standalone per uso diretto
export const testSentryConnection = () => {
  try {
    console.log('🧪 [Sentry Test] Avvio test di connessione...');
    if (!Sentry.getCurrentHub().getClient()) {
      console.warn('⚠️ [Sentry Test] Sentry non è inizializzato');
      return { success: false, error: 'Sentry non inizializzato' };
    }
    const eventId = Sentry.captureMessage('Test di connessione Sentry - TableTalk', 'info', { 
      tags: { 
        test: 'connection', 
        component: 'SentryTest',
        timestamp: new Date().toISOString()
      },
      extra: {
        environment: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || '1.0.0'
      }
    });
    console.log('✅ [Sentry Test] Test di connessione completato con successo');
    console.log('🆔 [Sentry Test] Event ID:', eventId);
    return { success: true, eventId };
  } catch (error) {
    console.error('❌ [Sentry Test] Errore durante il test:', error);
    return { success: false, error: error.message };
  }
};

export const testErrorCapture = () => {
  try {
    console.log('🧪 [Sentry Test] Avvio test cattura errori...');
    const testError = new Error('Errore di test per Sentry - TableTalk');
    testError.name = 'TestError';
    const eventId = Sentry.captureException(testError, { 
      tags: { 
        test: 'error_capture', 
        component: 'SentryTest',
        timestamp: new Date().toISOString()
      },
      extra: {
        environment: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION || '1.0.0'
      }
    });
    console.log('✅ [Sentry Test] Test cattura errori completato con successo');
    console.log('🆔 [Sentry Test] Event ID:', eventId);
    return { success: true, eventId };
  } catch (error) {
    console.error('❌ [Sentry Test] Errore durante il test di cattura:', error);
    return { success: false, error: error.message };
  }
};

export const testEnvironmentConfig = () => {
  try {
    console.log('🧪 [Sentry Test] Verifica configurazione ambiente...');
    const config = {
      dsn: process.env.REACT_APP_SENTRY_DSN ? 'Configured' : 'Not configured',
      environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      version: process.env.REACT_APP_VERSION || '1.0.0',
      debug: process.env.REACT_APP_DEBUG === 'true',
      errorMonitoring: process.env.REACT_APP_ENABLE_ERROR_MONITORING === 'true'
    };
    console.log('📋 [Sentry Test] Configurazione ambiente:', config);
    const isValid = config.dsn === 'Configured' && config.environment;
    if (isValid) { 
      console.log('✅ [Sentry Test] Configurazione ambiente valida'); 
    } else { 
      console.warn('⚠️ [Sentry Test] Configurazione ambiente incompleta'); 
    }
    return { success: isValid, config };
  } catch (error) {
    console.error('❌ [Sentry Test] Errore durante la verifica configurazione:', error);
    return { success: false, error: error.message };
  }
};

export default { 
  testConnection: testSentryConnection, 
  testErrorCapture: testErrorCapture, 
  testEnvironment: testEnvironmentConfig 
};
