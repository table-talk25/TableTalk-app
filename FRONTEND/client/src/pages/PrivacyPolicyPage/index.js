// File: FRONTEND/client/src/pages/PrivacyPolicyPage/index.js

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';

import styles from './PrivacyPolicyPage.module.css';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.privacyContainer}>
                        <button onClick={() => navigate(-1)} className={styles.backButton}>
                &larr; Torna Indietro
            </button>
            
            <h1 className={styles.mainTitle}>Privacy Policy di TableTalk</h1>
            <p className={styles.lastUpdated}>Ultimo aggiornamento: 12 luglio 2025</p>
            
            <p>Benvenuto in TableTalk. La tua privacy è di fondamentale importanza per noi. La presente Privacy Policy descrive quali dati personali raccogliamo, come li utilizziamo, con chi li condividiamo e quali sono i tuoi diritti in merito.</p>

            <h2 className={styles.sectionTitle}>1. Dati che Raccogliamo</h2>
            <p>Raccogliamo diverse categorie di dati per fornirti e migliorare il nostro servizio.</p>
            <ul>
                <li><strong>Dati forniti direttamente da te:</strong> Informazioni di registrazione (nome, cognome, email, password), informazioni del profilo (nickname, foto, bio, etc.) e comunicazioni con il supporto.</li>
                <li><strong>Dati generati durante l'uso del servizio:</strong> Dati sui pasti virtuali che crei o a cui partecipi e dati su come interagisci con l'app.</li>
            </ul>

            <h2 className={styles.sectionTitle}>2. Come Utilizziamo i Tuoi Dati</h2>
            <p>Utilizziamo i tuoi dati per fornire il servizio, personalizzare la tua esperienza, inviarti comunicazioni e garantire la sicurezza della piattaforma.</p>

            <h2 className={styles.sectionTitle}>3. Dati di Chat e Videochiamate</h2>
            <p><strong>Chat:</strong> I messaggi sono conservati per fornirti la cronologia ma non sono monitorati attivamente.</p>
            <p><strong>Videochiamate:</strong> Non registriamo né conserviamo il contenuto audio o video delle tue chiamate. Il servizio è facilitato da fornitori terzi che garantiscono la crittografia della connessione.</p>
            
            <h2 className={styles.sectionTitle}>4. Dati di Geolocalizzazione</h2>
            <p>Se fornisci il consenso, potremmo usare la tua posizione a livello di città per suggerirti pasti nelle vicinanze. Puoi disattivare questa funzione in qualsiasi momento dalle impostazioni del tuo dispositivo.</p>

            <h2 className={styles.sectionTitle}>5. Integrazione Futura di Funzionalità AI</h2>
            <p>In futuro, l'Intelligenza Artificiale potrebbe essere usata per migliorare i suggerimenti o la sicurezza. Qualsiasi implementazione verrà comunicata con un aggiornamento di questa policy e non utilizzerà dati sensibili senza il tuo esplicito consenso.</p>

            <h2 className={styles.sectionTitle}>6. Condivisione e Sicurezza dei Dati</h2>
            <p>Non vendiamo i tuoi dati. Li condividiamo solo con fornitori di servizi essenziali per il funzionamento dell'app. Adottiamo misure di sicurezza tecniche e organizzative per proteggere le tue informazioni.</p>
            
            <h2 className={styles.sectionTitle}>7. I Tuoi Diritti e le Tue Scelte</h2>
            <p>Hai il diritto di accedere, correggere o eliminare i tuoi dati personali. Puoi gestire la maggior parte delle tue informazioni dalle impostazioni del tuo profilo.</p>
            
            <h2 className={styles.sectionTitle}>8. Modifiche a questa Policy</h2>
            <p>Ti informeremo di eventuali modifiche sostanziali pubblicando la nuova policy sulla nostra app o tramite email.</p>
            
            <BackButton className="mb-4" /> 

        </div>
    );

};

export default PrivacyPolicyPage;