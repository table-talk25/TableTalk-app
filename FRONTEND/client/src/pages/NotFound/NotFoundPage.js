import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Pagina non trovata</h2>
      <p>La pagina che stai cercando non esiste.</p>
      <Link to="/" className="home-link">
        Torna alla home
      </Link>
    </div>
  );
};

export default NotFoundPage; 