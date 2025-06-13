// File: /src/pages/Meals/CreateMealPage.js (Versione Rifattorizzata e Pulita)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeals } from '../../contexts/MealsContext'; // <-- Il nostro context per le azioni
import { toast } from 'react-toastify';
import { Container, Row, Col, Card } from 'react-bootstrap';
import MealForm from '../../components/meals/MealForm'; // <-- Il nostro form riutilizzabile!
import '../../styles/CreateMealPage.css';

const CreateMealPage = () => {
  const navigate = useNavigate();
  const { createMeal } = useMeals(); // Prendiamo la funzione 'createMeal' dal context
  const [isLoading, setIsLoading] = useState(false);

  // Definiamo i dati iniziali per un pasto nuovo (vuoti)
  // Questo verrà passato al MealForm per popolare i campi.
  const initialMealData = {
    title: '',
    description: '',
    type: '',
    date: '',
    maxParticipants: 4,
    language: 'Italiano',
    topics: [],
    settings: {
        allowLateJoin: true,
    }
  };

  // Questa è l'unica funzione di logica che rimane nella nostra pagina.
  // Viene passata al MealForm e sarà eseguita al submit.
  const handleCreateSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const newMeal = await createMeal(formData); // Usiamo la funzione del context
      toast.success('Pasto creato con successo!');
      navigate(`/meals/${newMeal._id}`); // Reindirizziamo l'utente alla pagina del nuovo pasto
    } catch (error) {
      toast.error(error.message || 'Errore nella creazione del pasto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-meal-page">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="create-meal-card p-4">
              <Card.Body>
                <h2 className="create-meal-title text-center">Crea un Nuovo Pasto Virtuale</h2>
                
                {/* Usiamo il nostro componente MealForm! */}
                <MealForm
                  initialData={initialMealData}
                  onSubmit={handleCreateSubmit}
                  isLoading={isLoading}
                  submitButtonText="Crea Pasto"
                />

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateMealPage;