// File: frontend/client/src/components/profile/ProfileSettings.js (Versione Finale e Sicura)

import React, { useState, useEffect } from 'react';
import { FaBell, FaKey, FaSignOutAlt, FaTrash, FaLock, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './ProfileSettings.module.css';

const ProfileSettings = ({ profileData, onUpdate, onLogout, onDeleteAccount }) => {

  // --- 1. HOOKS CHIAMATI ALL'INIZIO ---
  // Inizializziamo lo stato in modo sicuro usando l'optional chaining '?'
  const [notificationSettings, setNotificationSettings] = useState({
    email: profileData?.settings?.notifications?.email ?? true,
  });

  console.log('[ProfileSettings] Renderizzato con showLocationOnMap:', profileData?.settings?.privacy?.showLocationOnMap);

    // --- 1. STATO LOCALE PER LA POSIZIONE ---
  // Creiamo uno stato locale anche per l'impostazione della posizione.
  const [showLocation, setShowLocation] = useState(
    profileData?.settings?.privacy?.showLocationOnMap ?? false
  );
  
    // --- 2. SYNC CON I PROPS ---
  // Questo useEffect assicura che se i dati cambiano dall'alto (es. primo caricamento),
  // il nostro stato locale si aggiorna di conseguenza.
  useEffect(() => {
    setShowLocation(profileData?.settings?.privacy?.showLocationOnMap ?? false);
  }, [profileData?.settings?.privacy?.showLocationOnMap]);

  // --- 2. GUARDIA DI SICUREZZA ---
  // Se i dati non sono ancora arrivati, non renderizzare nulla.
  if (!profileData) {
    return null;
  }

  // --- 3. FUNZIONI HANDLER ---
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    const newSettings = { ...notificationSettings, [name]: checked };
    setNotificationSettings(newSettings);
    
    onUpdate({ settings: { ...profileData.settings, notifications: newSettings } });
    toast.info('Impostazione di notifica aggiornata.');
  };

  // --- 3. GESTORE CLICK AGGIORNATO ---
  const handleLocationToggle = () => {
    // Aggiorniamo prima lo stato locale per un'interfaccia super reattiva
    const newSetting = !showLocation;
    setShowLocation(newSetting);
    
    // Poi chiamiamo la funzione del genitore per salvare il dato nel backend
    onUpdate({
        settings: {
            ...profileData.settings,
            privacy: {
                ...profileData.settings.privacy,
                showLocationOnMap: newSetting
            }
        }
    });

    toast.info('Impostazione della posizione aggiornata.');
  };

  const handleLogoutClick = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      onLogout();
    }
  };

  const handleDeleteClick = () => {
    const password = prompt("Per confermare, inserisci la tua password. ATTENZIONE: l'azione è irreversibile.");
    if (password) {
      onDeleteAccount(password);
    }
  };


  // --- 4. RENDER ---
  return (
    <div className={styles.container}>
      <h2>Impostazioni Avanzate</h2>

      {/* Sezione Notifiche */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><FaBell /> Notifiche</h3>
        <div className={styles.settingItem}>
            <p>Ricevi notifiche importanti via email</p>
            <label className={styles.switch}>
                <input type="checkbox" name="email" checked={notificationSettings.email} onChange={handleNotificationChange} />
                <span className={styles.slider}></span>
            </label>
        </div>
      </div>

      {/* Sezione Sicurezza e Privacy */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><FaLock /> Privacy e Sicurezza</h3>
        <div className={styles.settingItem}>
            <p>Abilita posizione per match in tempo reale</p>
            <label className={styles.switch}>
                {/* Usiamo l'optional chaining anche qui per sicurezza */}
                <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={handleLocationToggle}
                />
                <span className={styles.slider}></span>
            </label>
        </div>
        <button className={styles.actionButton} onClick={() => alert('Modale per il cambio password da implementare')}>
            <FaKey /> Cambia Password
        </button>
        <p className={styles.infoLink}>
        <FaInfoCircle /> Per maggiori dettagli, consulta la nostra             <Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
 
        </p>
      </div>

      {/* Sezione Account */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><FaSignOutAlt /> Account</h3>
        <button className={`${styles.actionButton} ${styles.logoutBtn}`} onClick={handleLogoutClick}>Esci dall'account</button>
        <button className={`${styles.actionButton} ${styles.deleteBtn}`} onClick={handleDeleteClick}><FaTrash /> Elimina Account</button>
      </div>
    </div>
  );
};

export default ProfileSettings;