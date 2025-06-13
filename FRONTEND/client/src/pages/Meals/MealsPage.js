// File: /src/pages/Meals/MealsPage.js (Versione con Context)

import React, { useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useMeals } from '../../contexts/MealsContext';
import MealsList from '../../components/meals/MealsList';
import MealFilters from '../../components/meals/MealFilters';
import '../../styles/MealsPage.css';

const MealsPage = () => {
  const { meals, loading, error, loadMeals } = useMeals();

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const handleFilterChange = (filters) => {
    loadMeals(filters);
  };

  return (
    <div className="meals-page">
      <Container>
        <div className="meals-header">
          <h1 className="meals-title text-center">Pasti Disponibili</h1>
          <p className="meals-subtitle text-center">
            Scopri i pasti organizzati dalla community e partecipa a esperienze culinarie uniche.
          </p>
        </div>

        <Row>
          <Col lg={3} className="filters-column">
            <MealFilters onFilterChange={handleFilterChange} />
          </Col>

          <Col lg={9} className="meals-content">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Link to="/meals/create" className="btn btn-primary">
                Crea un Pasto
              </Link>
            </div>

            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && (
              <MealsList meals={meals} />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MealsPage;