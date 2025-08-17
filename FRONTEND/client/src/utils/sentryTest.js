// File: FRONTEND/client/src/utils/sentryTest.js
// 🧪 TEST SEMPLICE PER SENTRY
// 
// Questo file contiene funzioni per testare il monitoraggio degli errori

import * as Sentry from '@sentry/react';

/**
 * Testa la connessione a Sentry
 */
export const testSentryConnection = () => {
  try {
    console.log('🧪 [Sentry Test] Avvio test di connessione...');
    
    // Test 1: Verifica se Sentry è inizializzato
    if (!Sentry.getCurrentHub().getClient()) {
      console.warn('⚠️ [Sentry Test] Sentry non è inizializzato');
      return { success: false, error: 'Sentry non inizializzato' };
    }
    
    // Test 2: Invia un messaggio di test
    const eventId = Sentry.captureMessage('Test di connessione Sentry - TableTalk', 'info', {
      tags: {
        type: 'connection_test',
        source: 'manual_test',
        app: 'TableTalk',
        timestamp: new Date().toISOString()
      },
      extra: {
        test_data: 'Questo è un test di connessione',
        user_agent: navigator.userAgent,
        url: window.location.href
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

/**
 * Testa la cattura di errori
 */
export const testErrorCapture = () => {
  try {
    console.log('🧪 [Sentry Test] Avvio test cattura errori...');
    
    // Crea un errore di test
    const testError = new Error('Errore di test per Sentry - TableTalk');
    testError.name = 'TestError';
    
    // Cattura l'errore
    const eventId = Sentry.captureException(testError, {
      tags: {
        type: 'test_error',
        source: 'manual_test',
        app: 'TableTalk',
        test_purpose: 'error_capture_verification'
      },
      extra: {
        test_data: 'Questo è un test di cattura errori',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
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

/**
 * Testa la configurazione dell'ambiente
 */
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

// Esporta le funzioni di test
export default {
  testConnection: testSentryConnection,
  testErrorCapture: testErrorCapture,
  testEnvironment: testEnvironmentConfig
};
