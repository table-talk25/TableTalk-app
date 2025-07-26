// File: src/pages/Home/index.js (Versione con testi scelti dall'utente)

import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaTicketAlt, FaVideo, FaUsers, FaLanguage, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext'; 
import Navbar from '../../components/layout/Navbar';
import styles from './HomePage.module.css';
import { useTranslation } from 'react-i18next'

function HomePage() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <div className={styles.homeContainer}>
      <Navbar />
      {/* --- SEZIONE HERO --- */}
      <section className={styles.heroSection}>
        <h1 dangerouslySetInnerHTML={{ __html: t('home.heroTitle') }} />
        <p>{t('home.heroSubtitle')}</p>
        <div className={styles.heroButtons}>
          {isAuthenticated ? (
            <>
              <Link to="/meals/create" className={styles.btn}>Crea un TableTalk®</Link>
              <Link to="/meals" className={styles.btn}>Esplora i TableTalk®</Link>
            </>
          ) : (
            <>
              <Link to="/register" className={styles.btn}>Registrati Ora</Link>
              <Link to="/login" className={styles.btn}>Accedi</Link>
            </>
          )}
        </div>
      </section>

      {/* --- SEZIONE "COME FUNZIONA" --- */}
      <section className={styles.featuresSection}>
        <h2>Partecipare è Semplice</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <FaSearch className={styles.featureIcon} />
            <h3>1. Scopri</h3>
            <p>
              Trova il tavolo virtuale perfetto per te. Filtra per lingua, orario o argomento e scegli la conversazione a cui vuoi unirti.
            </p>
          </div>
          <div className={styles.featureCard}>
            <FaTicketAlt className={styles.featureIcon} />
            <h3>2. Partecipa</h3>
            {/* SCELTA 3.C */}
            <p>
              Scegli, clicca, partecipa. È così semplice entrare in una conversazione. Ti basta solo la curiosità (e un po' di fame!).
            </p>
          </div>
          <div className={styles.featureCard}>
            <FaVideo className={styles.featureIcon} />
            <h3>3. Incontra</h3>
            <p>
              Accedi alla videochiamata e conosci i tuoi commensali. È il momento di condividere, imparare e gustare un TableTalk® in ottima compagnia.
            </p>
          </div>
        </div>
      </section>
      
      {/* --- SEZIONE "PERCHÉ TABLETALK?" --- */}
      <section className={`${styles.featuresSection} ${styles.secondarySection}`}>
        <h2>Perché TableTalk?</h2>
        <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
                <FaUsers className={styles.featureIcon} />
                <h3>Un antidoto alla solitudine</h3>
                {/* SCELTA 1.C */}
                <p>Che sia un caffè al volo o una cena elaborata, c'è sempre qualcuno con cui condividerla. La solitudine non è nel nostro menu.</p>
            </div>
            <div className={styles.featureCard}>
                <FaLanguage className={styles.featureIcon} />
                <h3>Amplia i tuoi orizzonti</h3>
                {/* SCELTA 2.B */}
                <p>Viaggia dal tuo tavolo da pranzo. Incontra persone e culture da tutto il mondo e allarga i tuoi orizzonti a ogni boccone.</p>
            </div>
            <div className={styles.featureCard}>
                <FaShieldAlt className={styles.featureIcon} />
                <h3>Connessioni autentiche e sicure</h3>
                <p>Un ambiente moderato e rispettoso dove puoi essere te stesso. Ogni profilo è un mondo da scoprire, in totale sicurezza.</p>
            </div>
        </div>
      </section>

      {/* --- SEZIONE CTA FINALE --- */}
      <section className={styles.ctaSection}>
        <h2>Che aspetti? Qualcuno sta per sedersi a tavola.</h2>
        <p>
          La registrazione è gratuita e richiede meno di un minuto.
        </p>
        <div className={styles.ctaButtons}>
          {isAuthenticated ? (
            <Link to="/meals/create" className={styles.btn}>
              Organizza il Tuo TableTalk®
            </Link>
          ) : (
            <Link to="/register" className={styles.btn}>
              Inizia Ora
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;