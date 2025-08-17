// File: FRONTEND/client/src/components/common/ErrorBoundary/index.js
// 🚨 ERROR BOUNDARY CON INTEGRAZIONE SENTRY
// 
// Questo componente cattura automaticamente gli errori di rendering
// e li invia a Sentry per il monitoraggio

import React from 'react';
import { withSentryReactRouterV6Routing } from '@sentry/react';
import errorMonitoringService from '../../../services/errorMonitoringService';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo stato per mostrare l'UI di fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Cattura l'errore e lo invia a Sentry
    try {
      const errorId = errorMonitoringService.captureError(error, {
        component: this.props.componentName || 'ErrorBoundary',
        action: 'render_error',
        errorInfo,
        componentStack: errorInfo.componentStack,
        fallback: this.props.fallback,
        timestamp: new Date().toISOString()
      });

      this.setState({
        error,
        errorInfo,
        errorId
      });

      console.error('🚨 Errore catturato da ErrorBoundary:', {
        error,
        errorInfo,
        errorId,
        component: this.props.componentName
      });

      // Chiama la callback personalizzata se fornita
      if (this.props.onError) {
        this.props.onError(error, errorInfo, errorId);
      }

    } catch (sentryError) {
      console.error('❌ Errore nell\'invio a Sentry:', sentryError);
      console.error('🚨 Errore originale:', error);
    }
  }

  // Funzione per resettare l'errore
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  // Funzione per riprovare l'operazione
  retry = () => {
    this.resetError();
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  // Funzione per tornare alla home
  goHome = () => {
    this.resetError();
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  // Funzione per aprire il supporto
  openSupport = () => {
    if (this.props.onSupport) {
      this.props.onSupport(this.state.errorId);
    } else {
      // Apri email di supporto con dettagli dell'errore
      const subject = encodeURIComponent('Errore TableTalk - Richiesta Supporto');
      const body = encodeURIComponent(`
Ciao Team TableTalk,

Ho riscontrato un errore nell'app:

ID Errore: ${this.state.errorId || 'N/A'}
Componente: ${this.props.componentName || 'Sconosciuto'}
Data: ${new Date().toLocaleString('it-IT')}
URL: ${window.location.href}

Dettagli dell'errore:
${this.state.error?.message || 'N/A'}

Stack trace:
${this.state.error?.stack || 'N/A'}

Grazie per l'assistenza!
      `);
      
      window.open(`mailto:infotabletalk.app@gmail.com?subject=${subject}&body=${body}`);
    }
  };

  render() {
    if (this.state.hasError) {
      // UI di fallback personalizzata
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          errorId: this.state.errorId,
          resetError: this.resetError,
          retry: this.retry,
          goHome: this.goHome,
          openSupport: this.openSupport
        });
      }

      // UI di fallback predefinita
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              🚨
            </div>
            
            <h1 className={styles.errorTitle}>
              Ops! Qualcosa è andato storto
            </h1>
            
            <p className={styles.errorMessage}>
              Si è verificato un errore imprevisto. Il nostro team è stato notificato e sta lavorando per risolverlo.
            </p>

            {this.state.errorId && (
              <div className={styles.errorId}>
                <strong>ID Errore:</strong> {this.state.errorId}
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Dettagli tecnici (solo sviluppo)</summary>
                <div className={styles.errorStack}>
                  <h4>Messaggio:</h4>
                  <pre>{this.state.error.message}</pre>
                  
                  <h4>Stack:</h4>
                  <pre>{this.state.error.stack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className={styles.errorActions}>
              <button 
                onClick={this.retry}
                className={styles.retryButton}
              >
                🔄 Riprova
              </button>
              
              <button 
                onClick={this.goHome}
                className={styles.homeButton}
              >
                🏠 Torna alla Home
              </button>
              
              <button 
                onClick={this.openSupport}
                className={styles.supportButton}
              >
                📧 Contatta Supporto
              </button>
            </div>

            <div className={styles.errorFooter}>
              <p>
                Se il problema persiste, contattaci all'indirizzo{' '}
                <a href="mailto:infotabletalk.app@gmail.com">
                  infotabletalk.app@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Se non ci sono errori, renderizza i figli normalmente
    return this.props.children;
  }
}

// Wrappa l'ErrorBoundary con Sentry per il routing
const SentryErrorBoundary = withSentryReactRouterV6Routing(ErrorBoundary);

// Componente funzionale wrapper per facilità d'uso
const ErrorBoundaryWrapper = ({ 
  children, 
  componentName,
  fallback,
  onError,
  onRetry,
  onGoHome,
  onSupport,
  ...props 
}) => {
  return (
    <SentryErrorBoundary
      componentName={componentName}
      fallback={fallback}
      onError={onError}
      onRetry={onRetry}
      onGoHome={onGoHome}
      onSupport={onSupport}
      {...props}
    >
      {children}
    </SentryErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
export { ErrorBoundary, SentryErrorBoundary };
