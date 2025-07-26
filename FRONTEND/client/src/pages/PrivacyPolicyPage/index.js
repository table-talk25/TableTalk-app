// File: FRONTEND/client/src/pages/PrivacyPolicyPage/index.js

// File: FRONTEND/client/src/pages/PrivacyPolicyPage/index.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PrivacyPolicyPage.module.css';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.privacyContainer}>
            <button onClick={() => navigate(-1)} className={styles.backButton}>
                &larr; Torna Indietro
            </button>
            
            <h1 className={styles.mainTitle}>Informativa sulla Privacy di TableTalk</h1>
            <p className={styles.lastUpdated}>Ultimo aggiornamento: 26 Luglio 2025</p>
            
            <p>Benvenuto in TableTalk, un'applicazione di TableTalk App ("noi", "ci", "nostro/a"). La tua privacy è una nostra priorità. Questa Informativa sulla Privacy spiega quali dati personali raccogliamo, come li utilizziamo e li proteggiamo, e i diritti che hai in relazione ai tuoi dati quando utilizzi la nostra applicazione ("Servizio").</p>

            <h2 className={styles.sectionTitle}>1. Base Giuridica del Trattamento</h2>
            <p>Trattiamo i tuoi dati personali in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) dell'UE e altre leggi sulla privacy applicabili. La base giuridica per il nostro trattamento include:</p>
            <ul>
                <li><strong>Necessità Contrattuale:</strong> Per fornire le funzionalità principali di TableTalk, come specificato nei nostri Termini di Servizio.</li>
                <li><strong>Consenso:</strong> Per funzionalità opzionali, come l'accesso alla tua posizione o alle notifiche push. Puoi revocare il tuo consenso in qualsiasi momento.</li>
                <li><strong>Interessi Legittimi:</strong> Per migliorare il nostro Servizio, garantire la sicurezza della piattaforma e prevenire frodi.</li>
            </ul>

            <h2 className={styles.sectionTitle}>2. Dati che Raccogliamo</h2>
            <p>Raccogliamo le seguenti categorie di dati:</p>
            <ul>
                <li><strong>Dati Forniti Direttamente da Te:</strong>
                    <ul>
                        <li><strong>Informazioni di Registrazione:</strong> Nome, cognome, indirizzo email e password (crittografata).</li>
                        <li><strong>Informazioni del Profilo:</strong> Nickname, foto del profilo, biografia e altre informazioni che scegli di condividere.</li>
                        <li><strong>Comunicazioni:</strong> Informazioni che ci fornisci quando contatti il nostro supporto clienti.</li>
                    </ul>
                </li>
                <li><strong>Dati Raccolti Durante l'Uso del Servizio:</strong>
                    <ul>
                        <li><strong>Dati di Interazione:</strong> Informazioni sui TableTalk® virtuali che crei, a cui partecipi, utenti che blocchi o segnali.</li>
                        <li><strong>Dati Tecnici:</strong> Indirizzo IP, tipo di dispositivo, sistema operativo, identificatori unici del dispositivo e dati di crash.</li>
                    </ul>
                </li>
                 <li><strong>Dati di Geolocalizzazione (con il tuo consenso):</strong> Se fornisci il consenso, potremmo usare la tua posizione a livello di città per suggerirti TableTalk® nelle vicinanze. Puoi disattivare questa funzione in qualsiasi momento dalle impostazioni del tuo dispositivo.</li>
            </ul>

            <h2 className={styles.sectionTitle}>3. Come Utilizziamo i Tuoi Dati</h2>
            <p>Utilizziamo i tuoi dati per le seguenti finalità:</p>
            <ul>
                <li>Per fornire, mantenere e migliorare il Servizio.</li>
                <li>Per personalizzare la tua esperienza, come suggerirti connessioni.</li>
                <li>Per gestire il tuo account e inviarti comunicazioni amministrative o di supporto.</li>
                <li>Per garantire la sicurezza della nostra piattaforma, monitorando attività sospette e applicando i nostri Termini di Servizio.</li>
            </ul>
            
            <h2 className={styles.sectionTitle}>4. Condivisione dei Dati</h2>
            <p>Non vendiamo né affittiamo i tuoi dati personali. Possiamo condividere le tue informazioni solo con le seguenti categorie di terze parti:</p>
            <ul>
                <li><strong>Fornitori di Servizi:</strong> Aziende che forniscono servizi per nostro conto, come l'hosting del backend (es. Render, AWS), servizi di comunicazione per le videochiamate e analisi. Questi fornitori hanno accesso ai tuoi dati solo per eseguire tali compiti per nostro conto e sono obbligati a non divulgarli o utilizzarli per altri scopi.</li>
                <li><strong>Obblighi di Legge:</strong> Se richiesto dalla legge o in risposta a richieste valide da parte di autorità pubbliche.</li>
            </ul>
            
            <h2 className={styles.sectionTitle}>5. Trasferimenti Internazionali di Dati</h2>
            <p>Essendo un servizio globale, i tuoi dati potrebbero essere trasferiti e trattati in paesi diversi da quello in cui risiedi. Ci assicuriamo che tali trasferimenti avvengano in conformità con le leggi sulla privacy applicabili, utilizzando tutele come le Clausole Contrattuali Standard approvate dalla Commissione Europea.</p>

            <h2 className={styles.sectionTitle}>6. Conservazione dei Dati</h2>
            <p>Conserviamo i tuoi dati personali solo per il tempo strettamente necessario a fornirti il Servizio e a adempiere alle finalità descritte in questa informativa. In caso di eliminazione dell'account, i tuoi dati personali verranno cancellati in modo sicuro e permanente entro 30 giorni, ad eccezione dei dati che siamo tenuti a conservare per obblighi legali (es. dati di fatturazione o per la prevenzione di frodi).</p>

            <h2 className={styles.sectionTitle}>7. I Tuoi Diritti sulla Privacy (GDPR)</h2>
            <p>In base al GDPR, hai diversi diritti in relazione ai tuoi dati personali:</p>
            <ul>
                <li><strong>Diritto di Accesso:</strong> Puoi richiedere una copia dei dati personali che abbiamo su di te.</li>
                <li><strong>Diritto di Rettifica:</strong> Puoi correggere i dati inesatti o incompleti dal tuo profilo o contattandoci.</li>
                <li><strong>Diritto alla Cancellazione ("Diritto all'Oblio"):</strong> Puoi richiedere la cancellazione dei tuoi dati personali.</li>
                <li><strong>Diritto di Limitazione del Trattamento:</strong> Puoi richiedere di limitare il modo in cui trattiamo i tuoi dati.</li>
                <li><strong>Diritto alla Portabilità dei Dati:</strong> Puoi richiedere di ricevere i tuoi dati in un formato strutturato e leggibile da dispositivo automatico.</li>
                <li><strong>Diritto di Opposizione:</strong> Puoi opporti al trattamento dei tuoi dati per finalità di marketing o basato su nostri interessi legittimi.</li>
            </ul>
            <p>Puoi esercitare la maggior parte di questi diritti attraverso le impostazioni del tuo account.</p>

            <h2 className={styles.sectionTitle}>8. Eliminazione dell'Account</h2>
            <p>Puoi eliminare il tuo account in qualsiasi momento direttamente dalla sezione "Impostazioni" della nostra app. L'eliminazione dell'account è un'azione irreversibile e comporterà la cancellazione definitiva di tutti i dati associati al tuo profilo, come descritto nelle nostre politiche di conservazione.</p>

            <h2 className={styles.sectionTitle}>9. Privacy dei Minori</h2>
            <p>Il nostro Servizio non è rivolto a persone di età inferiore a 18 anni. Non raccogliamo consapevolmente dati personali da minori. Se vieni a conoscenza del fatto che un minore ci ha fornito dati personali senza il consenso dei genitori, ti preghiamo di contattarci.</p>

            <h2 className={styles.sectionTitle}>10. Contattaci</h2>
            <p>Se hai domande, dubbi o richieste riguardanti questa Informativa sulla Privacy o il trattamento dei tuoi dati, ti preghiamo di contattarci al seguente indirizzo email dedicato: infotabletalk.app@gmail.com</p>
        </div>
    );
};

export default PrivacyPolicyPage;