import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    console.log('Cambio lingua a:', lng);
  };

  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      <button 
        onClick={() => changeLanguage('it')} 
        disabled={i18n.language === 'it'}
        style={{
          padding: '5px 10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: i18n.language === 'it' ? '#007bff' : '#fff',
          color: i18n.language === 'it' ? '#fff' : '#333',
          cursor: i18n.language === 'it' ? 'default' : 'pointer'
        }}
      >
        IT
      </button>
      <button 
        onClick={() => changeLanguage('en')} 
        disabled={i18n.language === 'en'}
        style={{
          padding: '5px 10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: i18n.language === 'en' ? '#007bff' : '#fff',
          color: i18n.language === 'en' ? '#fff' : '#333',
          cursor: i18n.language === 'en' ? 'default' : 'pointer'
        }}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;