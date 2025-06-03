import React, { useState } from 'react';
import { FaBell, FaKey, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import '../../styles/ProfileSettings.css';

const ProfileSettings = ({ profileData, onUpdate }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: profileData.settings?.emailNotifications ?? true,
    newMealNotifications: profileData.settings?.newMealNotifications ?? true,
    reminderNotifications: profileData.settings?.reminderNotifications ?? true
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };

  const saveNotificationSettings = async () => {
    await onUpdate({
      settings: {
        ...profileData.settings,
        ...notificationSettings
      }
    });
    alert('Impostazioni di notifica aggiornate con successo!');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const validatePassword = () => {
    if (passwordData.newPassword.length < 8) {
      setPasswordError('La password deve contenere almeno 8 caratteri');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Le password non coincidono');
      return false;
    }
    
    return true;
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      // Qui chiameresti un servizio per cambiare la password
      // es: await changeUserPassword(passwordData);
      
      alert('Password cambiata con successo!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
    } catch (error) {
      setPasswordError('Errore nel cambio password. Riprova più tardi.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      // Rimuovi il token e altri dati dalla sessione
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Reindirizza alla homepage
      window.location.href = '/';
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile!')) {
      // Qui chiameresti un servizio per eliminare l'account
      // es: await deleteUserAccount();
      
      alert('Account eliminato con successo.');
      
      // Reindirizza alla homepage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <div className="profile-settings-container">
      <section className="settings-section notification-settings">
        <h3><FaBell /> Impostazioni Notifiche</h3>
        
        <div className="notification-options">
          <div className="notification-option">
            <input
              type="checkbox"
              id="emailNotifications"
              name="emailNotifications"
              checked={notificationSettings.emailNotifications}
              onChange={handleNotificationChange}
            />
            <label htmlFor="emailNotifications">
              Ricevi email di notifica
            </label>
          </div>
          
          <div className="notification-option">
            <input
              type="checkbox"
              id="newMealNotifications"
              name="newMealNotifications"
              checked={notificationSettings.newMealNotifications}
              onChange={handleNotificationChange}
            />
            <label htmlFor="newMealNotifications">
              Notifiche per nuovi pasti
            </label>
          </div>
          
          <div className="notification-option">
            <input
              type="checkbox"
              id="reminderNotifications"
              name="reminderNotifications"
              checked={notificationSettings.reminderNotifications}
              onChange={handleNotificationChange}
            />
            <label htmlFor="reminderNotifications">
              Notifiche promemoria per i pasti imminenti
            </label>
          </div>
        </div>
        
        <button 
          className="save-settings-button"
          onClick={saveNotificationSettings}
        >
          Salva impostazioni
        </button>
      </section>
      
      <section className="settings-section password-section">
        <h3><FaKey /> Sicurezza</h3>
        
        <button 
          className="change-password-button"
          onClick={() => setShowPasswordModal(true)}
        >
          Cambia Password
        </button>
        
        {showPasswordModal && (
          <div className="password-modal-overlay">
            <div className="password-modal">
              <h4>Cambia Password</h4>
              
              <form onSubmit={changePassword}>
                {passwordError && (
                  <div className="password-error">{passwordError}</div>
                )}
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Password attuale</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">Nuova password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Conferma nuova password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Annulla
                  </button>
                  <button 
                    type="submit" 
                    className="confirm-button"
                  >
                    Conferma
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
      
      <section className="settings-section account-section">
        <h3>Account</h3>
        
        <button 
          className="logout-button"
          onClick={handleLogout}
        >
          <FaSignOutAlt /> Esci
        </button>
        
        <button 
          className="delete-account-button"
          onClick={handleDeleteAccount}
        >
          <FaTrash /> Elimina Account
        </button>
      </section>
    </div>
  );
};

export default ProfileSettings;