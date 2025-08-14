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
// import MealFilters from '../../../components/meals/MealFilters';


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
  // Filtri rimossi dalla pagina Meals: presenti nella pagina di ricerca

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

  // Nessun effetto filtri su Meals: la pagina è pulita

  const groupedMeals = useMemo(() => {
    if (searchResults) return {};
    const sorted = [...(meals || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.reduce((acc, meal) => {
      (acc[meal.type] = acc[meal.type] || []).push(meal);
      return acc;
    }, {});
  }, [meals, searchResults]);

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

  const isEmpty = !isSearching && !searchResults && !loading && !error && (meals?.length || 0) === 0;

  return (
    <Container fluid className={styles.mealsPage}>
      <div className={styles.topBar}><BackButton className={styles.backButton} /></div>
      <div className={styles.header}>
        <Link to="/meals/create" className={styles.createButton}>
          {t('meals.createButton')}
        </Link>
        {/* Barra di ricerca immediatamente sotto titolo e pulsanti */}
        <div className={styles.searchInHeader}>
          <div className={styles.searchContainer} onClick={() => window.location.href = '/meals/search'}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('meals.searchPlaceholder')}
              className={styles.searchInput}
              readOnly
            />
          </div>
        </div>
      </div>


      {isEmpty ? (
        <div className={styles.emptyFeed}> 
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <h2>{t('meals.emptyState.title')}</h2>
              <p>{t('meals.emptyState.description')}</p>
              <Link to="/meals/create" className={styles.ctaPrimary}>{t('meals.createButton')}</Link>
              <Link to="/map" className={styles.ctaSecondary}>Scopri sulla mappa</Link>
            </div>
          </div>

          <div className={styles.suggestedSection}>
            <h3 className={styles.sectionTitle}>Suggeriti per te</h3>
            <MealsList meals={[]} />
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.mealsSection}>
            {renderContent()}
          </div>
        </div>
      )}
    </Container>
  );
};

export default MealsPage;