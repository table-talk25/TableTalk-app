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


const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    mealService.getMeals({ status: 'upcoming,ongoing' })
      .then(response => setMeals(response.data))
      .catch(() => setError('Impossibile caricare i pasti.'))
      .finally(() => setLoading(false));
  }, []);

  // Effetto per la ricerca con debounce
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(null);
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

  const groupedMeals = useMemo(() => {
    if (searchResults) return {}; // Non calcolare se stiamo mostrando la ricerca
    return meals.reduce((acc, meal) => {
      (acc[meal.type] = acc[meal.type] || []).push(meal);
      return acc;
    }, {});
  }, [meals, searchResults]);

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
        return <div>Nessun pasto trovato per "{searchTerm}".</div>;
      }
    }
    // Altrimenti, mostra i caroselli di default
    return Object.keys(groupedMeals).length > 0 ? (
      Object.entries(groupedMeals).map(([type, mealsOfType]) => (
        <section key={type} className={styles.carouselSection}>
          <h2 className={styles.sectionTitle}>{getMealTypeText(type)}</h2>
          <div className={styles.carousel}>
            {mealsOfType.map(meal => (
              <div key={meal._id} className={styles.carouselItem}><MealCard meal={meal} /></div>
            ))}
          </div>
        </section>
      ))
    ) : <p className="text-center">Non ci sono TableTalk® in programma. Sii il primo a crearne uno!</p>;
  };

  if (loading) return <div className="text-center py-5"><Spinner /></div>;
  
  return (
    <Container fluid className={styles.page}>
      <header className={styles.header}>
        <h1>Scopri i Prossimi TableTalk®</h1>
        <input
          type="text"
          placeholder="Cerca per topic, lingua, tipo di pasto..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchBar}
        />
        <Link to="/meals/create" className={styles.createButton}>Crea TableTalk®</Link>
      </header>
      <main className={styles.content}>
        {renderContent()}
      </main>
      <BackButton className="mb-4" /> 
    </Container>
  );
};
export default MealsPage;