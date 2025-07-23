import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css'; 

const NotFoundPage = () => {
  return (
    <div className={styles.notFound}>
      <h1>404</h1>
      <h2>Pagina non trovata</h2>
      <p>La pagina che stai cercando non esiste.</p>
      <Link to="/" className={styles.homeLink}>
        Torna alla home
      </Link>
    </div>
  );
};

export default NotFoundPage; 