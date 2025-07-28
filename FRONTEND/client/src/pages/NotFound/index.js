import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFoundPage.module.css'; 

const NotFoundPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className={styles.notFound}>
      <h1>404</h1>
      <h2>{t('errors.pageNotFound')}</h2>
      <p>{t('errors.pageNotFoundMessage')}</p>
      <Link to="/" className={styles.homeLink}>
        {t('errors.backToHome')}
      </Link>
    </div>
  );
};

export default NotFoundPage; 