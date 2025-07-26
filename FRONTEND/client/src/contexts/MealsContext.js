// File: FRONTEND/client/src/contexts/MealsContext.js (Versione Corretta e Riorganizzata)

import React, { createContext, useContext, useState, useCallback } from 'react';
import mealService from '../services/mealService';
import { toast } from 'react-toastify';

// 1. Creiamo il Context a livello principale del file
const MealsContext = createContext(null);

// 2. Creiamo e ESPORTIAMO il nostro hook personalizzato a livello principale
export const useMeals = () => {
    const context = useContext(MealsContext);
    if (context === null) {
        throw new Error('Il componente che stai usando non è all\'interno del MealsProvider.');
    }
    return context;
};

// 3. Creiamo e ESPORTIAMO il componente Provider
export const MealsProvider = ({ children }) => {
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const createMeal = useCallback(async (formData) => {
        setLoading(true);
        try {
            const response = await mealService.createMeal(formData);
            return response;
        } catch (error) {
            console.error("Errore durante la creazione del TableTalk® nel context:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMeals = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await mealService.getMeals({ status: 'upcoming', limit: 100, ...params });
            setMeals(response.data);
            setError('');
        } catch (err) {
            setError('Errore nel caricamento dei TableTalk®. Riprova più tardi.');
            setMeals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const removeMealFromState = (mealId) => {
        setMeals(currentMeals => currentMeals.filter(meal => meal._id !== mealId));
    };

    // 4. Prepariamo l'oggetto 'value' che il provider condividerà.
    // Ho rimosso 'updateMeal' perché non era definito, causando un altro potenziale errore.
    const value = {
        meals,
        loading,
        error,
        fetchMeals,
        removeMealFromState,
        createMeal,
    };

    // 5. Il Provider avvolge i figli e fornisce il 'value'
    return (
        <MealsContext.Provider value={value}>
            {children}
        </MealsContext.Provider>
    );
};