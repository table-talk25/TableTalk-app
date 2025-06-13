import React from 'react';
import { Link } from 'react-router-dom';
import { FaUtensils, FaUsers, FaCalendarAlt, FaLanguage, FaComments } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext'; 
import '../../styles/HomePage.css';

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Benvenuto su TableTalk</h1>
        <p>
          La piattaforma che unisce persone attraverso il cibo e la conversazione.
          Organizza o partecipa a pasti condivisi, impara nuove lingue e crea connessioni significative.
        </p>
        <div className="hero-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/meals/create" className="btn btn-primary">
                Crea un Pasto
              </Link>
              <Link to="/meals" className="btn btn-secondary">
                Esplora i Pasti
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Registrati Ora
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Accedi
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features-section">
        <h2>Scopri i vantaggi di TableTalk</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FaUtensils className="feature-icon" />
            <h3>Organizza Pasti</h3>
            <p>
              Crea e gestisci facilmente i tuoi pasti condivisi.
              Scegli data, ora e numero di partecipanti in pochi click.
            </p>
          </div>
          <div className="feature-card">
            <FaUsers className="feature-icon" />
            <h3>Connetti Persone</h3>
            <p>
              Incontra nuove persone e condividi esperienze culinarie
              in un ambiente accogliente e sicuro.
            </p>
          </div>
          <div className="feature-card">
            <FaCalendarAlt className="feature-icon" />
            <h3>Pianifica</h3>
            <p>
              Organizza i tuoi pasti in anticipo e gestisci le partecipazioni
              in modo semplice ed efficiente.
            </p>
          </div>
          <div className="feature-card">
            <FaLanguage className="feature-icon" />
            <h3>Impara Lingue</h3>
            <p>
              Pratica le lingue straniere durante i pasti,
              in un contesto naturale e rilassato.
            </p>
          </div>
          <div className="feature-card">
            <FaComments className="feature-icon" />
            <h3>Condividi Esperienze</h3>
            <p>
              Scambia storie, ricette e consigli
              con persone da tutto il mondo.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Pronto a iniziare?</h2>
        <p>
          Unisciti alla community di TableTalk e inizia a condividere
          i tuoi pasti, le tue storie e le tue passioni.
        </p>
        <div className="cta-buttons">
          {isAuthenticated ? (
            <Link to="/meals/create" className="btn btn-primary">
              Crea il Tuo Prossimo Pasto
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              Iscriviti Gratuitamente
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage; 