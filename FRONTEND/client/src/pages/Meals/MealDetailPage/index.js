// File: src/pages/Meals/MealDetailPage/index.js (Versione Finale Completa)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import MealInlineEditor from '../../../components/meals/MealInlineEditor';

const MealDetailPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [meal, setMeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [now, setNow] = useState(new Date());
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const fetchMealDetails = useCallback(async () => {
        console.log('🔄 MealDetail: Inizio caricamento per ID:', id);
        setLoading(true);
        setError('');
        try {
            const response = await mealService.getMealById(id);
            console.log('🍽️ MealDetail: Response completa:', response);
            console.log('🍽️ MealDetail: Tipo response:', typeof response);
            console.log('🍽️ MealDetail: Keys response:', Object.keys(response || {}));
            
            // Proviamo diverse strutture possibili
            let mealData = null;
            if (response && response.data && response.data.data) {
                mealData = response.data.data;
                console.log('🎯 MealDetail: Usando response.data.data');
            } else if (response && response.data) {
                mealData = response.data;
                console.log('🎯 MealDetail: Usando response.data');
            } else if (response) {
                mealData = response;
                console.log('🎯 MealDetail: Usando response direttamente');
            }
            
            console.log('🍽️ MealDetail: Meal finale:', mealData);
            console.log('🍽️ MealDetail: Meal finale tipo:', typeof mealData);
            console.log('🍽️ MealDetail: Meal finale keys:', Object.keys(mealData || {}));
            
            if (!mealData) {
                throw new Error('Nessun dato ricevuto dal server');
            }
            
            setMeal(mealData);
        } catch (err) { 
            console.error('❌ MealDetail: Errore caricamento:', err);
            console.error('❌ MealDetail: Errore stack:', err.stack);
            toast.error(t('meals.detail.loadError'));
            setError(err.message || 'Errore nel caricamento del TableTalk®');
        } finally { 
            setLoading(false); 
        }
    }, [id, t]);

    useEffect(() => {
        console.log('🔄 MealDetail: useEffect triggered, ID:', id);
        if (!id) {
            console.error('❌ MealDetail: ID non valido:', id);
            setError('ID del TableTalk® non valido');
            setLoading(false);
            return;
        }
        fetchMealDetails();
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, [fetchMealDetails, id]);

    const handleJoinMeal = async () => {
        try {
            await mealService.joinMeal(id);
            toast.success(t('meals.detail.joinSuccess'));
            fetchMealDetails(); 
        } catch (err) {
            // Silenzia errori di rete transitori e riprova caricamento
            const transient = err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response;
            if (transient) {
                toast.info(t('meals.detail.joinPending')); // messaggio soft
                fetchMealDetails();
                return;
            }
            toast.error(err?.response?.data?.message || err.message || t('meals.detail.joinError'));
        }
    };

    const handleLeaveMealWithReason = async ({ reason, customReason }) => {
        try {
            await sendLeaveReport({ type: 'meal', id, reason, customReason });
            await mealService.leaveMeal(id);
            toast.success(t('meals.detail.leaveSuccess'));
            fetchMealDetails();
        } catch (err) {
            toast.error(t('meals.detail.leaveError'));
        } finally {
            setShowLeaveModal(false);
        }
    };

               // Funzione per lasciare la CHAT, non il TableTalk®
       const handleLeaveChat = async () => {
        if (!meal.chatId) return toast.error(t('meals.detail.chatIdNotFound'));
        if (window.confirm(t('meals.detail.confirmLeaveChat'))) {
            try {
                await chatService.leaveChat(meal.chatId);
                toast.success(t('meals.detail.chatLeaveSuccess'));
            } catch (err) {
                toast.error(err.message || t('meals.detail.chatLeaveError'));
            }
        }
    };

    const handleJoinChat = () => {
        if (meal && meal.chatId) {
            navigate(`/chat/${meal.chatId}`);
        } else {
            toast.error(t('meals.detail.chatNotAvailable'));
        }
    };

    const getParticipantsText = useCallback(() => {
        const count = meal?.participants?.length || 0;
        const max = meal?.maxParticipants || 0;
        const text = t('meals.detail.participantsCount', {
            count,
            max,
            defaultValue: `${count} di ${max} partecipanti`,
        });
        return text;
    }, [meal, t]);

    console.log('🎯 MealDetail: Render state - loading:', loading, 'meal:', !!meal, 'error:', error);
    
    if (loading) {
        console.log('🔄 MealDetail: Mostrando loading...');
        return (
           <Container className="text-center py-5">
            <Spinner animation="border" />
            <p>{t('meals.loading')}</p>
            </Container>
        );
    }
    
    if (error) {
        console.log('❌ MealDetail: Mostrando errore:', error);
        return (
            <Container className="text-center py-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="primary" onClick={fetchMealDetails}>
                    Riprova
                </Button>
            </Container>
        );
    }
    
    if (!meal) {
        console.log('❌ MealDetail: Meal non trovato');
        return (
            <Container className="text-center py-5">
                <Alert variant="warning">TableTalk® non trovato</Alert>
                <Link to="/meals">
                    <Button variant="primary">Torna ai TableTalk®</Button>
                </Link>
            </Container>
        );
    }

    const currentUserId = user?._id || user?.id;
    const hostId = meal?.host?._id || meal?.host?.id;
    const isHost = !!(currentUserId && hostId && currentUserId.toString() === hostId.toString());
    const isParticipant = Array.isArray(meal.participants) && meal.participants.some(p => {
        const pid = p?._id || p?.id;
        return pid && currentUserId && pid.toString() === currentUserId.toString();
    });
    const canJoin = !isHost && !isParticipant && meal.status === 'upcoming';
    const canLeave = isParticipant && meal.status === 'upcoming';
    const canJoinChat = isParticipant || isHost;
    const canLeaveChat = canJoinChat && meal.chatId;

    // Videochiamata: mostra da 10 minuti prima dell'inizio e durante l'evento
    const startTime = new Date(meal.date);
    const msToStart = startTime - now;
    const tenMinutesMs = 10 * 60 * 1000;
    const isVirtual = meal.mealType === 'virtual';
    const isWithinPreWindow = meal.status === 'upcoming' && msToStart <= tenMinutesMs;
    const isOngoing = meal.status === 'ongoing';
    const canJoinVideo = (isParticipant || isHost) && isVirtual && (isWithinPreWindow || isOngoing);

    const renderActionButtons = () => {
        return (
            <div className={styles.actionButtons}>
                {canJoin && (
                    <Button 
                        variant="success" 
                        size="lg" 
                        onClick={handleJoinMeal}
                        className={styles.joinButton}
                    >
                        {t('meals.joinMeal')}
                    </Button>
                )}
                
                {canLeave && (
                    <Button 
                        variant="outline-danger" 
                        size="lg" 
                        onClick={() => setShowLeaveModal(true)}
                        className={styles.leaveButton}
                    >
                        {t('meals.leaveMeal')}
                    </Button>
                )}

                {canJoinChat && (
                    <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handleJoinChat}
                        className={styles.chatButton}
                    >
                        <FaComments /> {t('meals.detail.joinChat')}
                    </Button>
                )}

                {canJoinVideo && (
                    <Button 
                        variant="danger" 
                        size="lg" 
                        onClick={() => navigate(`/meals/${id}/video`)}
                        className={styles.chatButton}
                    >
                        <FaVideo /> {t('meals.detail.joinVideo', { defaultValue: 'Videochiamata' })}
                    </Button>
                )}

                {canLeaveChat && (
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleLeaveChat}
                        className={styles.leaveChatButton}
                    >
                        {t('meals.detail.leaveChat')}
                    </Button>
                )}

                {isHost && meal.status === 'upcoming' && (
                    <Link to={`/meals/edit/${id}`}>
                        <Button variant="outline-primary" size="lg" className={styles.editButton}>
                            {t('meals.editMeal')}
                        </Button>
                    </Link>
                )}
            </div>
        );
    };

    return (
        <Container fluid className={styles.mealDetailPage}>
            <div className={styles.topBar}>
                <BackButton className={styles.backButton} />
            </div>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>{t('meals.mealDetails')}</h1>
            </div>

            <div className={styles.content}>
                <Row>
                    <Col lg={8}>
                        <Card className={styles.mainContent}>
                            <Card.Body>
                                <div className={styles.mealHeader}>
                                    <div className={styles.mealMeta}>
                                        <Badge bg={meal.mealType === 'virtual' ? 'info' : 'success'} className={styles.mealTypeBadge}>
                                            {meal.mealType === 'virtual' ? t('meals.mealType.virtual') : t('meals.mealType.physical')}
                                        </Badge>
                                        <Badge bg={meal.visibility === 'public' ? 'primary' : 'secondary'} className={styles.visibilityBadge}>
                                            {meal.visibility === 'public' ? t('meals.visibility.public') : t('meals.visibility.private')}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Editor inline per i campi del pasto */}
                                <MealInlineEditor
                                    meal={meal}
                                    onMealUpdate={setMeal}
                                    isHost={isHost}
                                    className={styles.mealInlineEditor}
                                />

                                <div className={styles.mealInfo}>
                                    <div className={styles.infoItem}>
                                        <FaUsers className={styles.infoIcon} />
                                        <span>{t('meals.detail.participantsText', { current: meal?.participants?.length || 0, max: meal?.maxParticipants || 0 })}</span>
                                    </div>
                                    {meal.topic && (
                                        <div className={styles.infoItem}>
                                            <FaTag className={styles.infoIcon} />
                                            <span>{meal.topic}</span>
                                        </div>
                                    )}
                                </div>

                                {renderActionButtons()}

                                <div className={styles.participantsCountFooter}>
                                    <FaUsers className={styles.infoIcon} />
                                    <span>{t('meals.detail.participantsText', { current: meal?.participants?.length || 0, max: meal?.maxParticipants || 0 })}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className={styles.hostCard}>
                            <Card.Header>
                                <h4>{t('meals.detail.host')}</h4>
                            </Card.Header>
                            <Card.Body>
                                <div className={styles.hostInfo}>
                                    <img 
                                        src={(() => {
                                            console.log('👤 [MealDetail] meal.host.profileImage:', meal.host.profileImage);
                                            const avatarUrl = getHostAvatarUrl(meal.host.profileImage);
                                            console.log('👤 [MealDetail] Generated avatar URL:', avatarUrl);
                                            return avatarUrl;
                                        })()} 
                                        alt={t('meals.detail.hostAvatarAlt')}
                                        className={styles.hostAvatar}
                                    />
                                    <div className={styles.hostDetails}>
                                        <h5>{meal.host.name} {meal.host.surname}</h5>
                                        <p className={styles.hostLocation}>
                                            <FaGlobe /> {meal.host.address || t('meals.detail.noLocation')}
                                        </p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {meal.participants && meal.participants.length > 0 && (
                            <Card className={styles.participantsCard}>
                                <Card.Header>
                                    <h4>{t('meals.detail.participantsList')}</h4>
                                </Card.Header>
                                <Card.Body>
                                    <div className={styles.participantsList}>
                                        {meal.participants.map((participant, index) => (
                                            <Link to={`/public-profile/${participant._id || participant.id}`} key={participant._id || index} className={styles.participant}>
                                                <img 
                                                    src={getHostAvatarUrl(participant.profileImage)} 
                                                    alt={t('meals.detail.participantAvatarAlt')}
                                                    className={styles.participantAvatar}
                                                />
                                                <span>{participant.nickname || `${participant.name || ''} ${participant.surname || ''}`.trim()}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>

            <LeaveReportModal
                show={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                onConfirm={handleLeaveMealWithReason}
                type="meal"
            />
        </Container>
    );
};

export default MealDetailPage;