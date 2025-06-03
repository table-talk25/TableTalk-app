import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import '../../styles/MealsList.css';

const MealsList = ({ meals, userMeals, onMealSelect, selectedMealId, loading, error }) => {
  // Funzione per formattare la data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Se è oggi
    if (date.toDateString() === now.toDateString()) {
      return `Oggi alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Se è domani
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Domani alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Altrimenti mostra la data completa
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funzione per determinare lo stato del pasto
  const getMealStatus = (meal) => {
    const now = new Date();
    const mealDate = new Date(meal.date);
    const endDate = new Date(mealDate);
    endDate.setHours(endDate.getHours() + 2); // Assumiamo che un pasto duri 2 ore

    if (meal.status === 'cancelled') {
      return { text: 'Cancellato', variant: 'danger', icon: 'fa-ban' };
    }
    if (now > endDate) {
      return { text: 'Completato', variant: 'secondary', icon: 'fa-check-circle' };
    }
    if (now >= mealDate && now <= endDate) {
      return { text: 'In corso', variant: 'warning', icon: 'fa-clock' };
    }
    return { text: 'In arrivo', variant: 'success', icon: 'fa-calendar-check' };
  };

  const getMealTypeBadge = (type) => {
    const types = {
      colazione: { text: 'Colazione', variant: 'info', icon: 'fa-coffee' },
      pranzo: { text: 'Pranzo', variant: 'success', icon: 'fa-utensils' },
      cena: { text: 'Cena', variant: 'primary', icon: 'fa-moon' },
      aperitivo: { text: 'Aperitivo', variant: 'warning', icon: 'fa-glass-cheers' }
    };
    const { text, variant, icon } = types[type] || { text: type, variant: 'secondary', icon: 'fa-utensils' };
    return (
      <Badge bg={variant} className="d-flex align-items-center">
        <i className={`fas ${icon} me-1`}></i>
        {text}
      </Badge>
    );
  };

  const getLanguageBadge = (language) => {
    const languages = {
      it: { text: 'Italiano', icon: 'fa-flag' },
      en: { text: 'Inglese', icon: 'fa-flag-usa' },
      es: { text: 'Spagnolo', icon: 'fa-flag' },
      fr: { text: 'Francese', icon: 'fa-flag' },
      de: { text: 'Tedesco', icon: 'fa-flag' }
    };
    const { text, icon } = languages[language] || { text: language, icon: 'fa-language' };
    return (
      <Badge bg="light" text="dark" className="d-flex align-items-center">
        <i className={`fas ${icon} me-1`}></i>
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Caricamento pasti...</span>
        </Spinner>
        <p className="mt-2 text-muted">Caricamento pasti in corso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
      </Alert>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="no-meals text-center p-4"
      >
        <i className="fas fa-utensils fa-3x mb-3 text-muted"></i>
        <h4 className="text-muted mb-2">Nessun pasto trovato</h4>
        <p className="text-muted small">Prova a modificare i filtri o crea un nuovo pasto!</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="meals-list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {meals.map((meal, index) => {
        const status = getMealStatus(meal);
        return (
          <motion.div
            key={meal._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/meals/${meal._id}`}
              className={`meal-list-item-link${selectedMealId === meal._id ? ' selected' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={() => onMealSelect(meal)}
              aria-label={`Visualizza dettagli del pasto: ${meal.title}`}
            >
              <Card className="meal-card mb-3">
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-center">
                    <span className="meal-title">{meal.title}</span>
                    <div className="d-flex gap-2">
                      {getMealTypeBadge(meal.type)}
                      {getLanguageBadge(meal.language)}
                    </div>
                  </Card.Title>
                  <Card.Text className="text-muted">
                    <small>
                      <i className="fas fa-calendar-alt me-2"></i>
                      {formatDate(meal.date)}
                    </small>
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <small className="text-muted">
                        <i className="fas fa-users me-1"></i>
                        {meal.participants?.length || 0}/{meal.maxParticipants}
                      </small>
                      <Badge bg={status.variant} className="d-flex align-items-center">
                        <i className={`fas ${status.icon} me-1`}></i>
                        {status.text}
                      </Badge>
                    </div>
                    <div className="d-flex gap-2">
                      {userMeals?.hosted?.includes(meal._id) && (
                        <Badge bg="success" className="d-flex align-items-center">
                          <i className="fas fa-crown me-1"></i>
                          Organizzatore
                        </Badge>
                      )}
                      {userMeals?.joined?.includes(meal._id) && (
                        <Badge bg="info" className="d-flex align-items-center">
                          <i className="fas fa-user-check me-1"></i>
                          Partecipante
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default MealsList;