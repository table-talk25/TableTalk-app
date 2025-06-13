// File: frontend/client/src/components/profile/ProfileSettings.js (Layout Bottoni Migliorato)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Form, Button, Card, Accordion, Modal } from 'react-bootstrap';
import { FaBell, FaLock, FaKey, FaSignOutAlt, FaTrash, FaHistory } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext'; 
import { toast } from 'react-toastify';

const ProfileSettings = ({ profileData, onUpdate }) => {
  const { logout, deleteAccount } = useAuth();
  const navigate = useNavigate(); 

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

  const [notifications, setNotifications] = useState({ email: true, push: true });
  const [privacy, setPrivacy] = useState({ showAge: true, showEmail: false });

  useEffect(() => {
    if (profileData && profileData.settings) {
      setNotifications(profileData.settings.notifications || { email: true, push: true });
      setPrivacy(profileData.settings.privacy || { showAge: true, showEmail: false });
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, checked, dataset } = e.target;
    const section = dataset.section;
    if (section === 'notifications') {
      setNotifications(prev => ({ ...prev, [name]: checked }));
    } else if (section === 'privacy') {
      setPrivacy(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSettingsSave = async () => {
    const currentSettings = profileData.settings || {};
    const newSettings = {
      ...currentSettings,
      notifications: notifications,
      privacy: privacy
    };
    await onUpdate({ settings: newSettings });
    toast.success("Impostazioni aggiornate!");
  };
  
  const handleMealHistoryClick = () => {
    navigate('/meals/history');
  };

  const handleDelete = () => {
    const password = window.prompt("Questa azione è irreversibile. Per confermare, inserisci la tua password:");
    if (password) {
      try {
        deleteAccount(password);
        toast.success("Il tuo account è stato eliminato.");
      } catch (error) {
        toast.error(error.message || "Password errata o errore nell'eliminazione.");
      }
    }
  };
  
  const handlePasswordUpdate = () => {
      console.log("Dati da inviare per cambio password:", passwordData);
      toast.info("Funzionalità di cambio password da implementare.");
      setShowPasswordModal(false);
  };

  return (
    <>
      <Card className="profile-settings-card-modern">
        <Card.Header as="h5">Impostazioni Account</Card.Header>
        <Card.Body>
          <Accordion defaultActiveKey="0">
            {/* ... Accordion (invariato) ... */}
            <Accordion.Item eventKey="0">
                <Accordion.Header><FaBell className="me-2" />Notifiche</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Check type="switch" id="email-notifications" name="email" data-section="notifications" label="Notifiche via Email" checked={notifications.email} onChange={handleChange}/>
                  </Form.Group>
                  <Form.Group>
                    <Form.Check type="switch" id="push-notifications" name="push" data-section="notifications" label="Notifiche Push" checked={notifications.push} onChange={handleChange}/>
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header><FaLock className="me-2" />Privacy</Accordion.Header>
                <Accordion.Body>
                  <Form.Group className="mb-3">
                    <Form.Check type="switch" id="show-age" name="showAge" data-section="privacy" label="Mostra la mia età sul profilo" checked={privacy.showAge} onChange={handleChange}/>
                  </Form.Group>
                  <Form.Group>
                    <Form.Check type="switch" id="show-email" name="showEmail" data-section="privacy" label="Mostra la mia email pubblicamente" checked={privacy.showEmail} onChange={handleChange}/>
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>
          </Accordion>

          <Button variant="primary" className="mt-3 w-100" onClick={handleSettingsSave}>
            Salva Impostazioni
          </Button>
          
          <hr />

          {/* --- LA MODIFICA È QUI --- */}
          <div className="profile-actions-container">
          <Button variant="info" className="text-white" onClick={handleMealHistoryClick}>
                  <FaHistory className="me-2" />Cronologia Pasti
              </Button>
              <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
                <FaKey className="me-2" />Cambia Password
              </Button>
              <Button variant="outline-danger" onClick={logout}><FaSignOutAlt className="me-2" />Esci</Button>
              <Button variant="danger" onClick={handleDelete}>
                <FaTrash className="me-2" />Elimina
              </Button>
          </div>
        </Card.Body>
      </Card>

      {/* --- Modale Password (invariato) --- */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambia la tua Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Password Attuale</Form.Label>
              <Form.Control type="password" placeholder="Inserisci la tua password attuale" onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}/>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nuova Password</Form.Label>
              <Form.Control type="password" placeholder="Inserisci la nuova password" onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}/>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handlePasswordUpdate}>
            Salva Modifiche
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProfileSettings;