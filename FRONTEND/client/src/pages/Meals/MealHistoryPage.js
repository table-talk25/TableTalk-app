// File: frontend/client/src/pages/Meals/MealHistoryPage.js (Versione Semplificata e Finale)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaUtensils, FaClipboardList } from 'react-icons/fa'; // Aggiunta FaClipboardList
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import mealService from '../../services/mealService';
import '../../styles/meals/MealHistoryPage.css';

const MealHistoryPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Stati per i pasti, il caricamento e la paginazione
    const [allMeals, setAllMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Nuovi stati per gestire la paginazione
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

        // --- 1. NUOVO STATO PER IL CONTEGGIO TOTALE ---
        const [totalMealsCount, setTotalMealsCount] = useState(0);

    // useCallback per evitare che la funzione venga ricreata ad ogni render
    const fetchUserMeals = useCallback(async (pageNum) => {
        if (!user?.id) return;
        
        // Se stiamo caricando una nuova pagina, mostriamo uno spinner diverso
        if(pageNum > 1) setLoadingMore(true); 
        else setLoading(true);

        try {
            const response = await mealService.getMeals({ user: user.id, page: pageNum, limit: 6 });
            const { data, totalPages: newTotalPages, totalResults } = response;
                        
            // Se è la prima pagina, sostituiamo i dati. Altrimenti, li aggiungiamo.
            setAllMeals(prev => pageNum === 1 ? data : [...prev, ...data]);
            setTotalPages(newTotalPages);
            // Aggiorniamo il conteggio totale solo al primo caricamento per evitare ricalcoli
            if(pageNum === 1) {
                setTotalMealsCount(totalResults);
            }

            } catch (err) {
                setError('Impossibile caricare la cronologia dei pasti.');
                console.error(err);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        }, [user]);
    
            // Questo useEffect si occupa di chiamare la funzione di caricamento
        useEffect(() => {
            fetchUserMeals(page);
        }, [page, fetchUserMeals]); // L'effetto si attiva quando 'page' cambia
    
        const handleLoadMore = () => {
            if (page < totalPages) {
                setPage(prevPage => prevPage + 1);
            }
        };
        
        const createdMeals = allMeals.filter(meal => meal.host?._id === user?.id);
        const participatedMeals = allMeals.filter(meal => meal.host?._id !== user?.id);

        const renderMealsList = (mealList, emptyMessage) => (
            <div className="meal-history-list">
                {(loading && mealList.length === 0) ? null : (mealList.length === 0 ? (
                    <p className="no-meals-message">{emptyMessage}</p>
                ) : (
                    mealList.map(meal => (
                        <div key={meal._id} className="meal-history-item" onClick={() => navigate(`/meals/${meal._id}`)}>
                            <div className="meal-history-item-header">
                                <h3>{meal.title}</h3>
                                <span className={`meal-status ${meal.status}`}>{meal.status}</span>
                            </div>
                            <div className="meal-history-item-details">
                                <div className="meal-detail">
                                    <FaCalendarAlt className="detail-icon" />
                                    <p>{format(new Date(meal.date), "d MMM yyyy 'alle' HH:mm", { locale: it })}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ))}
            </div>
        );
    
        if (loading && page === 1) return <div className="loading">Caricamento cronologia...</div>;
        if (error) return <div className="error-message">{error}</div>;
    
        return (
            <div className="meal-history-page">
                <div className="meal-history-header">
                    <h1>Cronologia Pasti</h1>

                {/* --- 3. MOSTRIAMO IL CONTATORE! --- */}
                <div className="total-meals-counter">
                    <FaClipboardList />
                    <span>Hai un totale di <strong>{totalMealsCount}</strong> pasti nella tua cronologia.</span>
                </div>
            </div>
                
                <section className="meal-section">
                    <h2><FaUtensils /> Pasti Creati da Te</h2>
                    {renderMealsList(createdMeals, "Non hai ancora creato nessun pasto.")}
                </section>
                
                <section className="meal-section">
                    <h2><FaUsers /> Pasti a cui hai Partecipato</h2>
                    {renderMealsList(participatedMeals, "Non hai ancora partecipato a nessun pasto.")}
                </section>
                
                <div className="load-more-container">
                    {page < totalPages && (
                        <button onClick={handleLoadMore} disabled={loadingMore} className="load-more-btn">
                            {loadingMore ? 'Caricamento...' : 'Carica Altri'}
                        </button>
                    )}
                </div>
            </div>
        );
    };
    
    export default MealHistoryPage;