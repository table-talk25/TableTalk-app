// File: src/pages/Meals/MealDetailPage/index.js (Versione Finale Completa)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import mealService from '../../../services/mealService';
import chatService from '../../../services/chatService';
import { toast } from 'react-toastify';
import styles from './MealDetailPage.module.css';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaUsers, FaTag, FaGlobe, FaUserCircle } from 'react-icons/fa';
import BackButton from '../../../components/common/BackButton';
import { FaComments, FaVideo } from 'react-icons/fa';
import { getHostAvatarUrl, getMealCoverImageUrl } from '../../../constants/mealConstants';
import LeaveReportModal from '../../../components/meals/LeaveReportModal';
import { sendLeaveReport } from '../../../services/apiService';

const MealDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [meal, setMeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [now, setNow] = useState(new Date());
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const fetchMealDetails = useCallback(async () => {
        setLoading(true);
        try {
            const response = await mealService.getMealById(id);
            setMeal(response.data);
        } catch (err) { 
            toast.error('Errore nel caricamento del TableTalk®.');
        } finally { 
            setLoading(false); 
        }
    }, [id]);

    useEffect(() => {
        fetchMealDetails();
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, [fetchMealDetails]);

    const handleJoinMeal = async () => {
        try {
            await mealService.joinMeal(id);
            toast.success('Ti sei unito al TableTalk®con successo!');
            fetchMealDetails(); 
        } catch (err) {
            toast.error(err.message || 'Non è stato possibile unirsi al TableTalk®.');
        }
    };

    const handleLeaveMealWithReason = async ({ reason, customReason }) => {
        try {
            await sendLeaveReport({ type: 'meal', id, reason, customReason });
            await mealService.leaveMeal(id);
            toast.success('Hai lasciato il TableTalk®. Grazie per il feedback!');
            fetchMealDetails();
        } catch (err) {
            toast.error('Errore durante l\'abbandono del TableTalk®.');
        } finally {
            setShowLeaveModal(false);
        }
    };

               // Funzione per lasciare la CHAT, non il TableTalk®
       const handleLeaveChat = async () => {
        if (!meal.chatId) return toast.error("ID della chat non trovato.");
        if (window.confirm('Sei sicuro di voler lasciare questa chat? Potrai rientrare in seguito.')) {
            try {
                await chatService.leaveChat(meal.chatId);
                toast.success('Hai lasciato la chat.');
            } catch (err) {
                toast.error(err.message || 'Errore durante l\'abbandono della chat.');
            }
        }
    };

    const handleJoinChat = () => {
        if (meal && meal.chatId) {
            navigate(`/chat/${meal.chatId}`);
        } else {
            toast.error('Chat non disponibile per questo TableTalk®.');
        }
    };

    if (loading || !meal) {
        return 
           <Container className="text-center py-5">
            <Spinner animation="border" />
            </Container>;
    }
    
    if (error) {
        return (
            <Container className="text-center py-5">
                <Alert variant="danger">{error}</Alert>
                <Button as={Link} to="/meals">Torna alla lista</Button>
            </Container>
        );
    }

    // Variabili di stato per una logica più pulita nel JSX
    const isHost = user && user.id === meal.host._id;
    const isParticipant = user && meal.participants.some(p => p._id === user.id);
    const isMember = isHost || isParticipant;
    const isFull = meal.participants.length >= meal.maxParticipants;
    const isUpcoming = meal.status === 'upcoming';
    const isCancelled = meal.status === 'cancelled';
    const isCompleted = meal.status === 'completed';

    const mealStartTime = new Date(meal.date).getTime();
    const tenMinutesBefore = mealStartTime - (10 * 60 * 1000);
    const mealEndTime = mealStartTime + (meal.duration * 60 * 1000);
    const showVideoCallButton = now.getTime() >= tenMinutesBefore && now.getTime() < mealEndTime;
    
    const coverImageUrl = getMealCoverImageUrl(meal.coverImage); 
    console.log('coverImage:', meal.coverImage, 'coverImageUrl:', coverImageUrl);

    const renderActionButtons = () => {
        if (!user) return <p className="text-muted">Effettua il login per partecipare.</p>;
        if (meal.status === 'cancelled') return <Alert variant="danger">Questo TableTalk® è stato annullato.</Alert>;
        if (meal.status === 'completed') return <Alert variant="success">Questo TableTalk® si è concluso.</Alert>;

        if (isHost && isUpcoming) {
            return <Button as={Link} to={`/meals/edit/${meal._id}`} variant="primary" className="w-100">Modifica TableTalk®</Button>;
        }
        if (isParticipant && !isHost && (isUpcoming || meal.status === 'ongoing')) {
            return <Button variant="outline-danger" className="w-100" onClick={() => setShowLeaveModal(true)}>Lascia il TableTalk®</Button>;
        }
        // Permetti di unirsi anche se il TableTalk® è ongoing
        if (!isParticipant && (isUpcoming || meal.status === 'ongoing') && !isFull) {
            return <Button variant="success" className="w-100" onClick={handleJoinMeal}>Unisciti al TableTalk®</Button>;
        }
        if (isFull && (isUpcoming || meal.status === 'ongoing')) {
            return <Button variant="secondary" className="w-100" disabled>TableTalk® al Completo</Button>;
        }
        return null; // Nessun pulsante da mostrare
    };

    return (
        <div className={styles.mealDetailPage}>
            <header className={styles.header} style={{ backgroundImage: `url(${coverImageUrl})` }}>
                <div className={styles.headerOverlay}>
                    <h1>{meal.title}</h1>
                    {isMember && (meal.status === 'upcoming' || meal.status === 'ongoing') && (
                        <div className={styles.headerActions}>
                            <Button as={Link} to={`/chat/${meal.chatId}`} variant="light" size="lg">
                                <FaComments /> Entra in Chat
                            </Button>
                            {showVideoCallButton && (
                                <Button as={Link} to={`/video/${meal._id}`} variant="success" size="lg">
                                    <FaVideo /> Entra in Videocall
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </header>

         <Container className={styles.contentContainer}>
                <Row>
                    <Col lg={8} className={styles.mainContent}>
                        <h2>Descrizione</h2>
                        <p>{meal.description}</p>
                        
                        <h2>Argomenti di Conversazione</h2>
                        <div className={styles.tagsContainer}>
                            {meal.topics.map(topic => <Badge key={topic} pill className={styles.topicTag}><FaTag /> {topic}</Badge>)}
                        </div>

                        <hr className="my-4" />

                        <h2>Partecipanti ({meal.participants.length})</h2>
                        <div className={styles.participantsContainer}>
                            {isMember ? (
                                // Se l'utente è host o partecipante, mostra tutti i dettagli
                                meal.participants.map(p => (
                                    <Link to={`/profilo/${p._id}`} key={p._id} className={styles.participant}>
                                        <img src={getHostAvatarUrl(p.profileImage)} alt={p.nickname} title={p.nickname} />
                                        <span>{p.nickname}</span>
                                    </Link>
                                ))
                            ) : (
                                // Se NON è membro, mostra solo l'host e avatar generici per gli altri
                                <>
                                    {/* Mostra l'host con nome e foto */}
                                    <Link to={`/profilo/${meal.host._id}`} key={meal.host._id} className={styles.participant}>
                                        <img src={getHostAvatarUrl(meal.host.profileImage)} alt={meal.host.nickname} title={meal.host.nickname} />
                                        <span>{meal.host.nickname} (Host)</span>
                                    </Link>
                                    {/* Mostra avatar generici per gli altri partecipanti */}
                                    {meal.participants.filter(p => p._id !== meal.host._id).map((p, idx) => (
                                        <div key={p._id} className={styles.participant} style={{ opacity: 0.5 }}>
                                            {/* Avatar generico o iniziali */}
                                            <div className={styles.genericAvatar}>
                                                {p.nickname && p.nickname.length > 0 ? p.nickname[0].toUpperCase() : '?'}
                                            </div>
                                            <span>Partecipante #{idx + 1}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </Col>
                    
                    <Col lg={4} className={styles.sidebar}>
                        <Card className={styles.detailsCard}>
                            <Card.Body>
                                <div className={styles.detailItem}><FaCalendarAlt /> {new Date(meal.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div className={styles.detailItem}><FaClock /> {new Date(meal.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute:'2-digit' })}</div>
                                <div className={styles.detailItem}><FaGlobe /> Lingua: {meal.language}</div>
                                <div className={styles.detailItem}><FaUsers /> {meal.participants.length} / {meal.maxParticipants} Posti</div>
                                <hr />
                                <div className={`${styles.detailItem} ${styles.hostInfo}`}>
                                    <FaUserCircle />
                                    <span>Organizzato da <Link to={`/profilo/${meal.host._id}`}>{meal.host.nickname}</Link></span>
                                </div>
                                <div className={styles.actionButtons}>
                                    {renderActionButtons()}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <BackButton className="mb-4" /> 
            <LeaveReportModal
                show={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                onConfirm={handleLeaveMealWithReason}
                type="meal"
            />
        </div>
    );
};

export default MealDetailPage;