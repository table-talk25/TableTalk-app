// File: src/pages/Meals/MealHistoryPage/index.js (Versione con tutti gli import)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMeals } from '../../../contexts/MealsContext';
import mealService from '../../../services/mealService';
import MealCard from '../../../components/meals/MealCard';
import { Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify'; 
import { FaHistory, FaClipboardList, FaUtensils, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './MealHistoryPage.module.css';
import BackButton from '../../../components/common/BackButton';

const MealHistoryPage = () => {
    const { user } = useAuth();
    const [allMeals, setAllMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUserMeals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Chiediamo tutti i TableTalk® dove l'utente è host o partecipante
            const response = await mealService.getUserMeals({ status: 'upcoming,ongoing,completed,cancelled' });
            setAllMeals(response.data);
        } catch (err) {
            setError('Errore nel caricamento dei tuoi TableTalk®.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserMeals();
    }, [fetchUserMeals]);

    useEffect(() => {
        if (!allMeals || !user?.id) return;
        const storiciPartecipati = allMeals.filter(m =>
            (m.status === 'completed' || m.status === 'cancelled') &&
            m.host?._id !== user.id &&
            m.participants.some(p => p._id === user.id)
        );
        console.log('DEBUG - Storico TableTalk® a cui hai partecipato:', storiciPartecipati);
    }, [allMeals, user]);

    useEffect(() => {
        if (!allMeals) return;
        const archivedMeals = allMeals.filter(m => m.status === 'completed' || m.status === 'cancelled');
        console.log('DEBUG - Tutti i TableTalk® archiviati (completed/cancelled):', archivedMeals);
    }, [allMeals]);

    useEffect(() => {
        if (!allMeals || !user?.id) return;
        const inProgramParticipated = allMeals.filter(m =>
            (m.status === 'upcoming' || m.status === 'ongoing') &&
            m.host?._id !== user.id &&
            m.participants.some(p => p._id === user.id)
        );
        console.log('DEBUG - In programma a cui parteciperai:', inProgramParticipated);
    }, [allMeals, user]);

            // Funzione per aggiornare la UI quando l'utente lascia un TableTalk®
    const handleLeaveSuccess = (mealId) => {
        setAllMeals(prevMeals => prevMeals.filter(meal => meal._id !== mealId));
    };

    // Usiamo useMemo per calcolare le liste in modo efficiente
    const { upcomingCreated, pastCreated, upcomingParticipated, pastParticipated } = useMemo(() => {
        if (!allMeals) {
            return { upcomingCreated: [], pastCreated: [], upcomingParticipated: [], pastParticipated: [] };
        }

        // Stati per "in programma"
        const isUpcomingOrOngoing = m => m.status === 'upcoming' || m.status === 'ongoing';
        // Stati per "storico"
        const isPast = m => m.status === 'completed' || m.status === 'cancelled';

        return {
            // TableTalk® creati dall'utente
            upcomingCreated: allMeals.filter(m => isUpcomingOrOngoing(m) && m.host?._id === user?.id),
            pastCreated: allMeals.filter(m => isPast(m) && m.host?._id === user?.id),

            // TableTalk® a cui l'utente partecipa (ma che non ha creato)
            upcomingParticipated: allMeals.filter(m =>
                isUpcomingOrOngoing(m) &&
                m.host?._id !== user?.id &&
                m.participants.some(p => p._id === user?.id)
            ),
            pastParticipated: allMeals.filter(m =>
                isPast(m) &&
                m.host?._id !== user?.id &&
                m.participants.some(p => p._id === user?.id)
            )
        };
    }, [allMeals, user?.id]);

    if (loading) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    if (error) {
        return <div className="text-center py-5"><Alert variant="danger">{error}</Alert></div>;
    }

    return (
        <div className={styles.mealHistoryPage}>
            <div className={styles.mealHistoryHeader}>
                <h1>I Miei TableTalk®</h1>
                <div className={styles.totalMealsCounter}>
                    <FaClipboardList />
                    <span>Hai <strong>{allMeals.length}</strong> TableTalk® totali nella tua cronologia</span>
                </div>
            </div>

            {/* Sezione TableTalk® in Programma */}
            <div className={styles.mainSection}>
                <h2 className={styles.mainSectionTitle}>In Programma</h2>
                <section className={styles.carouselSection}>
                    <h3 className={styles.sectionTitle}><FaUtensils /> TableTalk® che organizzi</h3>
                    {upcomingCreated.length > 0 ? (
                        <div className={styles.carousel}>
                            {upcomingCreated.map(meal => (
                                <div key={meal._id} className={styles.carouselItem}><MealCard meal={meal} onLeaveSuccess={handleLeaveSuccess} /></div>
                            ))}
                        </div>
                    ) : <p className={styles.noMealsMessage}>Non hai creato nessun TableTalk® in programma. <Link to="/meals/create">Creane uno ora!</Link></p>}
                </section>

                <section className={styles.carouselSection}>
                    <h3 className={styles.sectionTitle}><FaUsers /> TableTalk® a cui parteciperai</h3>
                    {upcomingParticipated.length > 0 ? (
                        <div className={styles.carousel}>
                            {upcomingParticipated.map(meal => (
                                <div key={meal._id} className={styles.carouselItem}><MealCard meal={meal} onLeaveSuccess={handleLeaveSuccess} /></div>
                            ))}
                        </div>
                    ) : <p className={styles.noMealsMessage}>Non ti sei ancora iscritto/a a nessun TableTalk®. <Link to="/meals">Scoprine qualcuno!</Link></p>}
                </section>
            </div>

            {/* Sezione Storico Passato */}
            <div className={styles.mainSection}>
                <h2 className={styles.mainSectionTitle}>Storico TableTalk® Passati</h2>
                <section className={styles.carouselSection}>
                    <h3 className={styles.sectionTitle}><FaUtensils /> TableTalk® che hai organizzato</h3>
                    {pastCreated.length > 0 ? (
                        <div className={styles.carousel}>
                            {pastCreated.map(meal => (
                                <div key={meal._id} className={styles.carouselItem}><MealCard meal={meal} onLeaveSuccess={handleLeaveSuccess} /></div>
                            ))}
                        </div>
                    ) : <p className={styles.noMealsMessage}>Nessuno dei tuoi TableTalk® organizzati è ancora terminato.</p>}
                </section>

                <section className={styles.carouselSection}>
                    <h3 className={styles.sectionTitle}><FaUsers /> TableTalk® a cui hai partecipato</h3>
                    {pastParticipated.length > 0 ? (
                        <div className={styles.carousel}>
                            {pastParticipated.map(meal => (
                                <div key={meal._id} className={styles.carouselItem}><MealCard meal={meal} onLeaveSuccess={handleLeaveSuccess} /></div>
                            ))}
                        </div>
                    ) : <p className={styles.noMealsMessage}>Non hai ancora partecipato a nessun TableTalk®.</p>}
                </section>
            </div>
            <BackButton className="mb-4" /> 
        </div>
    );
};

export default MealHistoryPage;