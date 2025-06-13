// File: /src/pages/Meals/MealDetailPage.js (Nuova Pagina)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import mealService from '../../services/mealService';
import MealDetail from '../../components/meals/MealDetail'; // <-- Importiamo il nostro componente

const MealDetailPage = () => {
  const { id } = useParams(); // Legge l'ID del pasto dall'URL
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        setLoading(true);
        const data = await mealService.getMealById(id);
        setMeal(data);
      } catch (err) {
        setError(err.message || 'Impossibile trovare il pasto specificato.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]); // L'effetto si riattiva se l'ID nell'URL cambia

  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center p-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/meals" className="btn btn-primary">Torna alla lista dei pasti</Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {meal ? (
        <MealDetail meal={meal} />
      ) : (
        <Alert variant="warning">Pasto non trovato.</Alert>
      )}
    </Container>
  );
};

export default MealDetailPage;