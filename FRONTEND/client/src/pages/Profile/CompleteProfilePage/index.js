// File: /src/pages/Profile/CompleteProfilePage/index.js
// Pagina obbligatoria per completare il profilo dopo il primo login

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { useProfile } from '../../../contexts/ProfileContext';
import ProfileForm from '../../../components/profile/ProfileForm';
import styles from './CompleteProfilePage.module.css';

const CompleteProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { refreshProfile } = useProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Controlla se il profilo è già completo
  useEffect(() => {
    if (user?.profileCompleted) {
      setIsProfileComplete(true);
      // Reindirizza alla pagina principale dopo un breve delay
      setTimeout(() => {
        navigate('/meals');
      }, 2000);
    }
  }, [user, navigate]);

  // Gestisce il submit del form di completamento profilo
  const handleProfileSubmit = async (profileData) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 [CompleteProfile] Aggiornamento profilo in corso...');
      
      // Aggiorna il profilo
      await updateProfile(profileData);
      
      // Aggiorna il profilo nel context
      await refreshProfile();
      
      console.log('✅ [CompleteProfile] Profilo completato con successo!');
      
      // Mostra messaggio di successo
      setIsProfileComplete(true);
      
      // Reindirizza alla pagina principale dopo un breve delay
      setTimeout(() => {
        navigate('/meals');
      }, 2000);
      
    } catch (error) {
      console.error('❌ [CompleteProfile] Errore aggiornamento profilo:', error);
      setError(error.message || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Se il profilo è già completo, mostra messaggio di successo
  if (isProfileComplete) {
    return (
      <Container className={styles.completeProfilePage}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className={styles.successCard}>
              <Card.Body className="text-center">
                <div className={styles.successIcon}>🎉</div>
                <h3 className={styles.successTitle}>Profilo Completato!</h3>
                <p className={styles.successMessage}>
                  Perfetto! Il tuo profilo è ora completo e puoi accedere a tutte le funzionalità dell'app.
                </p>
                <p className={styles.redirectMessage}>
                  Reindirizzamento alla pagina principale...
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/meals')}
                  className={styles.redirectButton}
                >
                  Vai subito ai pasti
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className={styles.completeProfilePage}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {/* Header informativo */}
          <div className={styles.header}>
            <div className={styles.welcomeIcon}>👋</div>
            <h1 className={styles.title}>Benvenuto su TableTalk!</h1>
            <p className={styles.subtitle}>
              Per iniziare a usare l'app, devi completare il tuo profilo. 
              Questo ci aiuta a creare un'esperienza migliore per tutti.
            </p>
          </div>

          {/* Alert informativo */}
          <Alert variant="info" className={styles.infoAlert}>
            <strong>💡 Perché completare il profilo?</strong>
            <ul className="mb-0 mt-2">
              <li>Gli altri utenti possono conoscerti meglio</li>
              <li>Trovi pasti più adatti ai tuoi interessi</li>
              <li>L'app può suggerirti contenuti personalizzati</li>
              <li>Partecipi a una community più coinvolgente</li>
            </ul>
          </Alert>

          {/* Form di completamento profilo */}
          <Card className={styles.profileCard}>
            <Card.Header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Completa il tuo profilo</h2>
              <p className={styles.cardSubtitle}>
                I campi con <span className="text-danger">*</span> sono obbligatori
              </p>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <ProfileForm
                initialData={user}
                onSubmit={handleProfileSubmit}
                isLoading={isLoading}
                isSubmitting={isLoading}
                submitButtonText="Completa Profilo"
                showRequiredFieldsOnly={true}
                isCompleteProfileMode={true}
              />
            </Card.Body>
          </Card>

          {/* Note aggiuntive */}
          <div className={styles.notes}>
            <p className={styles.noteText}>
              <strong>Nota:</strong> Potrai sempre modificare il tuo profilo in seguito dalle impostazioni.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CompleteProfilePage;
