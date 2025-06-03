import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import MealsList from './MealsList';
import MealDetail from './MealDetail';
import MealFilters from './MealFilters';
import { getMeals, getUserMeals } from '../../services/mealService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/MealsPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    date: '',
    language: '',
    search: '',
    sortBy: '',
    sortOrder: ''
  });
  const [userMeals, setUserMeals] = useState({
    hosted: [],
    joined: []
  });
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { user } = useUser();

  // Funzione per caricare i pasti dal server
  const fetchMeals = useCallback(async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    setError('');
    try {
      const data = await getMeals(filters);
      setMeals(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Impossibile caricare i pasti. Riprova più tardi.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  }, [filters]);

  // Funzione per caricare i pasti dell'utente
  const fetchUserMeals = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const [hosted, joined] = await Promise.all([
        getUserMeals('hosted'),
        getUserMeals('joined')
      ]);
      setUserMeals({ hosted, joined });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Errore durante il caricamento dei tuoi pasti';
      toast.error(errorMessage);
    }
  }, [currentUser]);

  // Carica i pasti quando cambiano i filtri
  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Carica i pasti dell'utente quando cambia l'utente
  useEffect(() => {
    if (currentUser) {
      fetchUserMeals();
    }
  }, [fetchUserMeals, currentUser]);

  // Gestione della selezione di un pasto
  const handleMealSelect = (meal) => {
    setSelectedMeal(meal);
  };

  // Gestione del completamento della creazione di un pasto
  const handleMealCreated = async (newMeal) => {
    try {
      if (newMeal) {
        // Verifica che newMeal sia un oggetto valido
        if (typeof newMeal === 'object' && newMeal !== null) {
          // Aggiungi il nuovo pasto all'inizio della lista
          setMeals(prevMeals => [newMeal, ...prevMeals]);
          
          // Aggiorna anche la lista dei pasti dell'utente
          await fetchUserMeals();
          
          // Aggiorna la lista completa dei pasti
          await fetchMeals(true);
          
          toast.success('Pasto creato con successo!');
        } else {
          throw new Error('Risposta non valida dal server');
        }
      }
    } catch (error) {
      console.error('Errore durante la creazione del pasto:', error);
      toast.error(error.message || 'Errore durante l\'aggiornamento della lista dei pasti');
    }
  };

  // Gestione del successo dell'iscrizione a un pasto
  const handleJoinSuccess = async (updatedMeal) => {
    try {
      setMeals(prevMeals => 
        prevMeals.map(meal => meal._id === updatedMeal._id ? updatedMeal : meal)
      );
      setSelectedMeal(updatedMeal);
      await fetchUserMeals();
      toast.success('Ti sei iscritto al pasto con successo!');
    } catch (error) {
      toast.error('Errore durante l\'iscrizione al pasto');
    }
  };

  // Gestione del successo dell'abbandono di un pasto
  const handleLeaveSuccess = async () => {
    try {
      await Promise.all([fetchMeals(true), fetchUserMeals()]);
      toast.success('Hai abbandonato il pasto con successo');
    } catch (error) {
      toast.error('Errore durante l\'abbandono del pasto');
    }
  };

  // Gestione del successo della cancellazione di un pasto
  const handleCancelSuccess = async () => {
    try {
      setSelectedMeal(null);
      await Promise.all([fetchMeals(true), fetchUserMeals()]);
      toast.success('Pasto cancellato con successo');
    } catch (error) {
      toast.error('Errore durante la cancellazione del pasto');
    }
  };

  // Gestione dei filtri
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  // Gestione della ricerca
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  // Gestione dell'ordinamento
  const handleSort = (sortBy, sortOrder) => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  // Reset dei filtri
  const handleReset = () => {
    setFilters({
      type: '',
      date: '',
      language: '',
      search: '',
      sortBy: '',
      sortOrder: ''
    });
  };

  return (
    <Container fluid className="meals-page py-4">
      <div className="meals-header text-center mb-5">
        <h1 className="meals-title">Pasti Disponibili</h1>
        <p className="meals-subtitle">
          Scopri i pasti organizzati dalla community e partecipa a esperienze culinarie uniche
        </p>
      </div>
      <Row>
        <Col lg={3} className="filters-column">
          <MealFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onSort={handleSort}
            onReset={handleReset}
          />
        </Col>
        <Col lg={9} className="meals-content">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link to="/meals/create" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Crea un Pasto
            </Link>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </Spinner>
            </div>
          ) : (
            <Row>
              <Col lg={selectedMeal ? 6 : 12}>
                <MealsList
                  meals={meals}
                  onMealSelect={handleMealSelect}
                  selectedMeal={selectedMeal}
                  userMeals={userMeals}
                  onJoinSuccess={handleJoinSuccess}
                  onLeaveSuccess={handleLeaveSuccess}
                  onCancelSuccess={handleCancelSuccess}
                />
              </Col>
              {selectedMeal && (
                <Col lg={6}>
                  <MealDetail
                    meal={selectedMeal}
                    onClose={() => setSelectedMeal(null)}
                    onJoinSuccess={handleJoinSuccess}
                    onLeaveSuccess={handleLeaveSuccess}
                    onCancelSuccess={handleCancelSuccess}
                    userMeals={userMeals}
                  />
                </Col>
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MealsPage;