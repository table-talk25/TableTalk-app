import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { createReport } from '../../../services/apiService';
import styles from './ReportModal.module.css';

const ReportModal = ({ show, onHide, reportedUser, context = 'general' }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    reason: '',
    details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = [
    'Comportamento Inappropriato',
    'Spam',
    'Profilo Falso',
    'Altro'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError('Seleziona un motivo per la segnalazione');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createReport({
        reportedUserId: reportedUser._id,
        reason: formData.reason,
        details: formData.details,
        context
      });

      setSuccess(true);
      setTimeout(() => {
        onHide();
        setSuccess(false);
        setFormData({ reason: '', details: '' });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante l\'invio della segnalazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onHide();
      setFormData({ reason: '', details: '' });
      setError('');
      setSuccess(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Segnala Utente</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {success ? (
          <Alert variant="success">
            Segnalazione inviata con successo. Grazie per aver contribuito a mantenere TableTalk® un ambiente sicuro.
          </Alert>
        ) : (
          <>
            <div className={styles.userInfo}>
              <img
                src={reportedUser?.profileImage ? `/uploads/profile-images/${reportedUser.profileImage}` : '/default-avatar.jpg'}
                alt={reportedUser?.nickname}
                className={styles.userAvatar}
              />
              <div>
                <h6>{reportedUser?.nickname}</h6>
                <small className="text-muted">Utente da segnalare</small>
              </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Motivo della segnalazione *</Form.Label>
                <Form.Select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                >
                  <option value="">Seleziona un motivo</option>
                  {reasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Dettagli aggiuntivi</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Fornisci ulteriori dettagli sulla segnalazione (opzionale)"
                />
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        {!success && (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Annulla
            </Button>
            <Button 
              variant="danger" 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.reason}
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia Segnalazione'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal; 