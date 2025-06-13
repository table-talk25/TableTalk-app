import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import mealService from '../services/mealService';

const MealsContext = createContext(null);

export const MealsProvider = ({ children }) => {
  // --- STATO GLOBALE DEI PASTI ---
  const [meals, setMeals] = useState([]);
  const [userMeals, setUserMeals] = useState({
    created: [],
    participated: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    sortBy: 'date'
  });

  // --- FUNZIONI PER GESTIRE I PASTI ---

  // Carica tutti i pasti disponibili
  const loadMeals = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealService.getMeals(filters);
      setMeals(data);
      return data;
    } catch (error) {
      setError(error.message);
      toast.error('Errore nel caricamento dei pasti');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica i pasti dell'utente (creati e a cui ha partecipato)
  const loadUserMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [created, participated] = await Promise.all([
        mealService.getCreatedMeals(),
        mealService.getParticipatedMeals()
      ]);
      setUserMeals({ created, participated });
      return { created, participated };
    } catch (error) {
      setError(error.message);
      toast.error('Errore nel caricamento dei tuoi pasti');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crea un nuovo pasto
  const createMeal = useCallback(async (mealData) => {
    setLoading(true);
    setError(null);
    try {
      const newMeal = await mealService.createMeal(mealData);
      setMeals(prev => [newMeal, ...prev]);
      setUserMeals(prev => ({
        ...prev,
        created: [newMeal, ...prev.created]
      }));
      toast.success('Pasto creato con successo!');
      return newMeal;
    } catch (error) {
      setError(error.message);
      toast.error('Errore nella creazione del pasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Aggiorna un pasto esistente
  const updateMeal = useCallback(async (mealId, mealData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMeal = await mealService.updateMeal(mealId, mealData);
      setMeals(prev => prev.map(meal => 
        meal._id === mealId ? updatedMeal : meal
      ));
      setUserMeals(prev => ({
        ...prev,
        created: prev.created.map(meal => 
          meal._id === mealId ? updatedMeal : meal
        )
      }));
      toast.success('Pasto aggiornato con successo!');
      return updatedMeal;
    } catch (error) {
      setError(error.message);
      toast.error('Errore nell\'aggiornamento del pasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Elimina un pasto
  const deleteMeal = useCallback(async (mealId) => {
    setLoading(true);
    setError(null);
    try {
      await mealService.deleteMeal(mealId);
      setMeals(prev => prev.filter(meal => meal._id !== mealId));
      setUserMeals(prev => ({
        ...prev,
        created: prev.created.filter(meal => meal._id !== mealId)
      }));
      toast.success('Pasto eliminato con successo!');
    } catch (error) {
      setError(error.message);
      toast.error('Errore nell\'eliminazione del pasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Partecipa a un pasto
  const joinMeal = useCallback(async (mealId) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMeal = await mealService.joinMeal(mealId);
      setMeals(prev => prev.map(meal => 
        meal._id === mealId ? updatedMeal : meal
      ));
      setUserMeals(prev => ({
        ...prev,
        participated: [updatedMeal, ...prev.participated]
      }));
      toast.success('Hai aderito al pasto con successo!');
      return updatedMeal;
    } catch (error) {
      setError(error.message);
      toast.error('Errore nell\'adesione al pasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lascia un pasto
  const leaveMeal = useCallback(async (mealId) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMeal = await mealService.leaveMeal(mealId);
      setMeals(prev => prev.map(meal => 
        meal._id === mealId ? updatedMeal : meal
      ));
      setUserMeals(prev => ({
        ...prev,
        participated: prev.participated.filter(meal => meal._id !== mealId)
      }));
      toast.success('Hai lasciato il pasto con successo!');
      return updatedMeal;
    } catch (error) {
      setError(error.message);
      toast.error('Errore nell\'abbandono del pasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- VALORE DEL CONTEXT ---
  const value = {
    // Stato
    meals,
    userMeals,
    loading,
    error,
    filters,
    setFilters,
    
    // Funzioni
    loadMeals,
    loadUserMeals,
    createMeal,
    updateMeal,
    deleteMeal,
    joinMeal,
    leaveMeal
  };

  return (
    <MealsContext.Provider value={value}>
      {children}
    </MealsContext.Provider>
  );
};

// Hook personalizzato per utilizzare il context
export const useMeals = () => {
  const context = useContext(MealsContext);
  if (!context) {
    throw new Error('useMeals deve essere usato all\'interno di un MealsProvider');
  }
  return context;
}; 