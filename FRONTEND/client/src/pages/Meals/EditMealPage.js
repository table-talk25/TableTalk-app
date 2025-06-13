// File: /src/pages/Meals/EditMealPage.js (Versione Corretta e Pulita)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeals } from '../../contexts/MealsContext';
import mealService from '../../services/mealService'; // Usiamo il servizio per il fetch iniziale
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import MealForm from '../../components/meals/MealForm'; // <-- RIUTILIZZIAMO IL NOSTRO FORM!

const EditMealPage = () => {
  // --- 1. HOOKS E STATO ---
  const { id } = useParams(); // Otteniamo l'ID del pasto dall'URL
  const navigate = useNavigate();
  const { updateMeal } = useMeals(); // Prendiamo solo la funzione di update dal context

  const [initialData, setInitialData] = useState(null); // Stato per i dati iniziali del pasto
  const [loading, setLoading] = useState(true); // Stato per il caricamento iniziale
  const [error, setError] = useState(''); // Stato per gli errori di caricamento
  const [isUpdating, setIsUpdating] = useState(false); // Stato per il salvataggio

  // --- 2. RECUPERO DATI INIZIALI ---
  // Questo useEffect viene eseguito solo una volta per caricare i dati del pasto
  useEffect(() => {
    const fetchMealData = async () => {
      try {
        setLoading(true);
        // Usiamo il nostro servizio, che usa axiosInstance e gestisce l'autenticazione!
        const mealData = await mealService.getMealById(id);
        setInitialData(mealData);
      } catch (err) {
        setError('Impossibile caricare i dati del pasto. Potrebbe non esistere o non hai i permessi.');
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMealData();
  }, [id]); // Si riattiva solo se l'ID del pasto cambia

  // --- 3. GESTIONE DEL SUBMIT ---
  // Questa funzione viene passata al MealForm e sarà eseguita al salvataggio
  const handleEditSubmit = async (formData) => {
    setIsUpdating(true);
    try {
      const updatedMeal = await updateMeal(id, formData); // Usiamo la funzione del context
      toast.success('Pasto aggiornato con successo!');
      navigate(`/meals/${updatedMeal._id}`); // Reindirizziamo alla pagina di dettaglio
    } catch (err) {
      toast.error(err.message || 'Errore durante l\'aggiornamento.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 4. RENDER DEL COMPONENTE ---
  if (loading) {
    return <Container className="text-center p-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="text-center p-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="p-4 shadow-lg">
            <Card.Body>
              <h2 className="text-center mb-4">Modifica il Tuo Pasto</h2>
              {initialData ? (
                // Usiamo il nostro componente MealForm, passandogli i dati caricati!
                <MealForm
                  initialData={initialData}
                  onSubmit={handleEditSubmit}
                  isLoading={isUpdating}
                  submitButtonText="Salva Modifiche"
                />
              ) : (
                <Alert variant="warning">Dati del pasto non trovati.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditMealPage;