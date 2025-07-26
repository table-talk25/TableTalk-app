// File: src/pages/Meals/MealsPage/index.js (Versione Finale, Corretta e Completa)

import React, { useState, useEffect, useMemo } from 'react'; 
import { Link } from 'react-router-dom';
import mealService from '../../../services/mealService';
import { useMeals } from '../../../contexts/MealsContext';
import MealCard from '../../../components/meals/MealCard';
import { Spinner, Alert, Container } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { getMealTypeText } from '../../../constants/mealConstants';
import styles from './MealsPage.module.css';
import BackButton from '../../../components/common/BackButton';
import MealsList from '../../../components/meals/MealsList';
import MealFilters from '../../../components/meals/MealFilters';


const MealsPage = () => {
          // Uso il context per la lista TableTalk® principale
  const { meals, loading, error, fetchMeals } = useMeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // Stato per i filtri
  const [filters, setFilters] = useState({
    type: '',
            mealType: '', // Nuovo filtro per tipo di TableTalk® (virtuale/fisico)
    status: '',
    sortBy: 'date',
  });

  useEffect(() => {
    fetchMeals({ status: 'upcoming,ongoing' });
    // eslint-disable-next-line
  }, []);

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
        setSearchError('Si è verificato un errore durante la ricerca.');
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimeout = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

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

  const renderContent = () => {
    if (isSearching) {
      return <div>Caricamento...</div>;
    }
    if (searchError) {
      return <div>{searchError}</div>;
    }
    if (searchResults) {
      if (searchResults.length > 0) {
        return <MealsList meals={searchResults} />;
      } else {
        return <div>Nessun TableTalk® trovato per "{searchTerm}".</div>;
      }
    }
    // Gestione errori e loading dal context
    if (loading) return <div className="text-center py-5"><Spinner /></div>;
    if (error) return <div className="text-center py-5" style={{ color: 'red' }}>{error}</div>;
    // Altrimenti, mostra i caroselli di default
    if (Object.keys(groupedMeals).length === 0) {
      return <div className="text-center py-5">Nessun TableTalk® trovato con i filtri applicati.</div>;
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
        <h1 className={styles.pageTitle}>TableTalk®</h1>
        <Link to="/meals/create" className={styles.createButton}>
          Crea TableTalk®
        </Link>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cerca TableTalk®..."
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