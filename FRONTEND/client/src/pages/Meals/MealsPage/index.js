// File: src/pages/Meals/MealsPage/index.js (Versione Finale, Corretta e Completa)

import React, { useState, useEffect, useMemo } from 'react'; 
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mealService from '../../../services/mealService';
import { useMeals } from '../../../contexts/MealsContext';
import { useAuth } from '../../../contexts/AuthContext';
import MealCard from '../../../components/meals/MealCard';
import { Spinner, Alert, Container } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useMealTranslations } from '../../../hooks/useMealTranslations';
import styles from './MealsPage.module.css';
import BackButton from '../../../components/common/BackButton';
import MealsList from '../../../components/meals/MealsList';
import MealFilters from '../../../components/meals/MealFilters';


const MealsPage = () => {
  const { t } = useTranslation();
  const { getMealTypeText } = useMealTranslations();
  
  // PRIMA: Tutti gli hooks devono essere chiamati all'inizio
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { meals, loading, error, fetchMeals } = useMeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    mealType: '', // Nuovo filtro per tipo di TableTalk® (virtuale/fisico)
    status: '',
    sortBy: 'date',
  });

  useEffect(() => {
    console.log('🔄 MealsPage: Caricamento pasti...');
    fetchMeals({ status: 'upcoming,ongoing' });
    // eslint-disable-next-line
  }, []);

  // Debug: log dei pasti caricati
  useEffect(() => {
    console.log('📊 MealsPage: Pasti caricati:', meals?.length || 0, meals);
  }, [meals]);

  // Effetto per la ricerca con debounce
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(null);
      setSearchError('');
      return;
    }
    setIsSearching(true);
    setSearchError('');
    const fetchResults = async () => {
      try {
        const response = await mealService.searchMeals(searchTerm);
        setSearchResults(response.data);
      } catch (error) {
        setSearchError(t('meals.searchError'));
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimeout = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, t]);

  // Effetto per applicare i filtri (solo esempio, puoi adattare la logica)
  useEffect(() => {
    // Puoi chiamare fetchMeals con i filtri, oppure filtrare i TableTalk® già caricati
    // fetchMeals({ ...filters, status: filters.status || 'upcoming,ongoing' });
    // Per ora non richiama fetchMeals per non sovrascrivere la ricerca
  }, [filters]);

  const groupedMeals = useMemo(() => {
    if (searchResults) return {}; // Non calcolare se stiamo mostrando la ricerca
    // Applica i filtri ai TableTalk® caricati
    let filteredMeals = meals;
    
    // Filtro per tipo di TableTalk® (colazione, pranzo, ecc.)
    if (filters.type) {
      filteredMeals = filteredMeals.filter(m => m.type === filters.type);
    }
    
    // Filtro per modalità (virtuale/fisico)
    if (filters.mealType) {
      filteredMeals = filteredMeals.filter(m => m.mealType === filters.mealType);
    }
    
    // Filtro per stato
    if (filters.status) {
      filteredMeals = filteredMeals.filter(m => m.status === filters.status);
    }
    
    // Ordinamento
    if (filters.sortBy === 'participants') {
      filteredMeals = [...filteredMeals].sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
    } else {
      filteredMeals = [...filteredMeals].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    return filteredMeals.reduce((acc, meal) => {
      (acc[meal.type] = acc[meal.type] || []).push(meal);
      return acc;
    }, {});
  }, [meals, searchResults, filters]);

  // DOPO: Controlli di autenticazione
  // Se l'utente non è autenticato, reindirizza al login
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se l'autenticazione è ancora in caricamento, mostra un loading
  if (authLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  const renderContent = () => {
    if (isSearching) {
      return <div>{t('meals.loading')}</div>;
    }
    if (searchError) {
      return <div>{searchError}</div>;
    }
    if (searchResults) {
      if (searchResults.length > 0) {
        return <MealsList meals={searchResults} />;
      } else {
        return <div>{t('meals.noMealsFound', { searchTerm })}</div>;
      }
    }
    // Gestione errori e loading dal context
    if (loading) return <div className="text-center py-5"><Spinner animation="border" /> {t('meals.loading')}</div>;
    if (error) return <div className="text-center py-5" style={{ color: 'red' }}>{error}</div>;
    
    // Debug: mostra informazioni sui pasti
    console.log('🎯 MealsPage: Pasti disponibili:', meals?.length || 0);
    console.log('🎯 MealsPage: Pasti raggruppati:', Object.keys(groupedMeals).length, groupedMeals);
    
    // Altrimenti, mostra i caroselli di default
    if (Object.keys(groupedMeals).length === 0) {
      return (
        <div className="text-center py-5">
          <p>{t('meals.emptyState.title')}</p>
          <p>{t('meals.emptyState.description')}</p>
          <Link to="/meals/create" className="btn btn-primary">
            {t('meals.createButton')}
          </Link>
        </div>
      );
    }
    return Object.entries(groupedMeals).map(([type, mealsList]) => (
      <div key={type} className="mb-4">
        <h3 className={styles.sectionTitle}>{getMealTypeText(type)}</h3>
        <MealsList meals={mealsList} />
      </div>
    ));
  };

  return (
    <Container fluid className={styles.mealsPage}>
      <div className={styles.header}>
        <BackButton />
        <h1 className={styles.pageTitle}>{t('meals.pageTitle')}</h1>
        <Link to="/meals/create" className={styles.createButton}>
          {t('meals.createButton')}
        </Link>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder={t('meals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.filtersSection}>
          <MealFilters filters={filters} onFilterChange={setFilters} />
        </div>
        <div className={styles.mealsSection}>
          {renderContent()}
        </div>
      </div>
    </Container>
  );
};

export default MealsPage;