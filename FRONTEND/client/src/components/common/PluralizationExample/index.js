// File: src/components/common/PluralizationExample/index.js
// 🌍 COMPONENTE ESEMPIO PER PLURALIZZAZIONE DINAMICA
// 
// Questo componente dimostra come utilizzare il sistema di pluralizzazione
// per creare interfacce multilingue professionali

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import usePluralization from '../../../hooks/usePluralization';
import styles from './PluralizationExample.module.css';

const PluralizationExample = () => {
  const { t, i18n } = useTranslation();
  const { 
    pluralizeMeal, 
    pluralizeParticipant, 
    pluralizeMessage,
    pluralizeNotification,
    pluralizeUser,
    pluralizeDay,
    pluralizeHour,
    pluralizeKilometer
  } = usePluralization();

  // Stato per i contatori di esempio
  const [counts, setCounts] = useState({
    meals: 1,
    participants: 2,
    messages: 0,
    notifications: 5,
    users: 1,
    days: 7,
    hours: 24,
    kilometers: 50
  });

  // Cambia lingua
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Incrementa/decrementa contatori
  const updateCount = (key, delta) => {
    setCounts(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🌍 Esempio Pluralizzazione Dinamica</h2>
        <p>Cambia lingua e modifica i numeri per vedere la pluralizzazione in azione</p>
      </div>

      {/* Selettore Lingua */}
      <div className={styles.languageSelector}>
        <h3>🌐 Lingua Corrente: {i18n.language.toUpperCase()}</h3>
        <div className={styles.languageButtons}>
          <button 
            onClick={() => changeLanguage('it')}
            className={i18n.language === 'it' ? styles.active : ''}
          >
            🇮🇹 Italiano
          </button>
          <button 
            onClick={() => changeLanguage('en')}
            className={i18n.language === 'en' ? styles.active : ''}
          >
            🇬🇧 English
          </button>
          <button 
            onClick={() => changeLanguage('fr')}
            className={i18n.language === 'fr' ? styles.active : ''}
          >
            🇫🇷 Français
          </button>
          <button 
            onClick={() => changeLanguage('de')}
            className={i18n.language === 'de' ? styles.active : ''}
          >
            🇩🇪 Deutsch
          </button>
        </div>
      </div>

      {/* Esempi di Pluralizzazione */}
      <div className={styles.examples}>
        <h3>📊 Esempi di Pluralizzazione</h3>
        
        {/* Pasti */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('meals', -1)}>-</button>
            <span className={styles.count}>{counts.meals}</span>
            <button onClick={() => updateCount('meals', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Pasti:</strong> {pluralizeMeal(counts.meals)}
          </div>
        </div>

        {/* Partecipanti */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('participants', -1)}>-</button>
            <span className={styles.count}>{counts.participants}</span>
            <button onClick={() => updateCount('participants', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Partecipanti:</strong> {pluralizeParticipant(counts.participants)}
          </div>
        </div>

        {/* Messaggi */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('messages', -1)}>-</button>
            <span className={styles.count}>{counts.messages}</span>
            <button onClick={() => updateCount('messages', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Messaggi:</strong> {pluralizeMessage(counts.messages)}
          </div>
        </div>

        {/* Notifiche */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('notifications', -1)}>-</button>
            <span className={styles.count}>{counts.notifications}</span>
            <button onClick={() => updateCount('notifications', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Notifiche:</strong> {pluralizeNotification(counts.notifications)}
          </div>
        </div>

        {/* Utenti */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('users', -1)}>-</button>
            <span className={styles.count}>{counts.users}</span>
            <button onClick={() => updateCount('users', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Utenti:</strong> {pluralizeUser(counts.users)}
          </div>
        </div>

        {/* Giorni */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('days', -1)}>-</button>
            <span className={styles.count}>{counts.days}</span>
            <button onClick={() => updateCount('days', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Giorni:</strong> {pluralizeDay(counts.days)}
          </div>
        </div>

        {/* Ore */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('hours', -1)}>-</button>
            <span className={styles.count}>{counts.hours}</span>
            <button onClick={() => updateCount('hours', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Ore:</strong> {pluralizeHour(counts.hours)}
          </div>
        </div>

        {/* Chilometri */}
        <div className={styles.exampleItem}>
          <div className={styles.controls}>
            <button onClick={() => updateCount('kilometers', -1)}>-</button>
            <span className={styles.count}>{counts.kilometers}</span>
            <button onClick={() => updateCount('kilometers', 1)}>+</button>
          </div>
          <div className={styles.result}>
            <strong>Distanza:</strong> {pluralizeKilometer(counts.kilometers)}
          </div>
        </div>
      </div>

      {/* Informazioni Tecniche */}
      <div className={styles.technicalInfo}>
        <h3>🔧 Informazioni Tecniche</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Lingua Corrente:</strong> {i18n.language}
          </div>
          <div className={styles.infoItem}>
            <strong>Fallback:</strong> {i18n.options.fallbackLng}
          </div>
          <div className={styles.infoItem}>
            <strong>Separatore Plurali:</strong> {i18n.options.pluralSeparator || '_'}
          </div>
          <div className={styles.infoItem}>
            <strong>Separatore Chiavi:</strong> {i18n.options.keySeparator || '.'}
          </div>
        </div>
      </div>

      {/* Codice di Esempio */}
      <div className={styles.codeExample}>
        <h3>💻 Codice di Esempio</h3>
        <pre className={styles.code}>
{`// Utilizzo dell'hook
const { pluralizeMeal, pluralizeParticipant } = usePluralization();

// Pluralizzazione automatica
const mealText = pluralizeMeal(5);        // "5 TableTalk®"
const participantText = pluralizeParticipant(1); // "1 partecipante"

// Con interpolazione
const result = t('meals.mealCount', { count: 3 });`}
        </pre>
      </div>
    </div>
  );
};

export default PluralizationExample;
