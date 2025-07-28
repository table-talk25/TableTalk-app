// File: frontend/client/src/pages/TermsAndConditionsPage/index.js

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from 'react-bootstrap';
import BackButton from '../../components/common/BackButton';

const TermsAndConditionsPage = () => {
  const { t } = useTranslation();

  return (
    <Container className="my-5" style={{ maxWidth: '800px' }}>
      <h1 className="mb-4">{t('terms.title')}</h1>
      <p><strong>{t('terms.lastUpdated')}</strong></p>
      
      <p className="lead">
        {t('terms.welcome')}
      </p>

      <h3 className="mt-4">{t('terms.acceptance.title')}</h3>
      <p>
        {t('terms.acceptance.description')}
      </p>

      <h3 className="mt-4">{t('terms.service.title')}</h3>
      <p>
        {t('terms.service.description')}
      </p>

      <h3 className="mt-4">{t('terms.conduct.title')}</h3>
      <p>
        {t('terms.conduct.description')}
      </p>

      <h3 className="mt-4">{t('terms.liability.title')}</h3>
      <p>
        {t('terms.liability.description')}
      </p>

      <h3 className="mt-4">{t('terms.modifications.title')}</h3>
      <p>
        {t('terms.modifications.description')}
      </p>

      <BackButton className="mb-4" /> 

    </Container>
  );
};

export default TermsAndConditionsPage;