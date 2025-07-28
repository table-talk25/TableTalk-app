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
        setLoading(true);
        try {
            const response = await mealService.getMealById(id);
            setMeal(response.data);
        } catch (err) { 
            toast.error(t('meals.detail.loadError'));
        } finally { 
            setLoading(false); 
        }
    }, [id, t]);

    useEffect(() => {
        fetchMealDetails();
        const timer = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(timer);
    }, [fetchMealDetails]);

    const handleJoinMeal = async () => {
        try {
            await mealService.joinMeal(id);
            toast.success(t('meals.detail.joinSuccess'));
            fetchMealDetails(); 
        } catch (err) {
            toast.error(err.message || t('meals.detail.joinError'));
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
            </Container>
        );
    }

    const isHost = user && meal.host && user.id === meal.host.id;
    const isParticipant = meal.participants && meal.participants.some(p => p.id === user?.id);
    const canJoin = !isHost && !isParticipant && meal.status === 'upcoming';
    const canLeave = isParticipant && meal.status === 'upcoming';
    const canJoinChat = isParticipant || isHost;
    const canLeaveChat = canJoinChat && meal.chatId;

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
                    <Link to={`/meals/${id}/edit`}>
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
            <div className={styles.header}>
                <BackButton />
                <h1 className={styles.pageTitle}>{t('meals.mealDetails')}</h1>
            </div>

            <div className={styles.content}>
                <Row>
                    <Col lg={8}>
                        <Card className={styles.mealCard}>
                            <div className={styles.coverImageContainer}>
                                <img 
                                    src={getMealCoverImageUrl(meal)} 
                                    alt={t('meals.detail.coverImageAlt')}
                                    className={styles.coverImage}
                                />
                            </div>
                            
                            <Card.Body>
                                <div className={styles.mealHeader}>
                                    <h2 className={styles.mealTitle}>{meal.title}</h2>
                                    <div className={styles.mealMeta}>
                                        <Badge bg={meal.mealType === 'virtual' ? 'info' : 'success'} className={styles.mealTypeBadge}>
                                            {meal.mealType === 'virtual' ? t('meals.mealType.virtual') : t('meals.mealType.physical')}
                                        </Badge>
                                        <Badge bg={meal.visibility === 'public' ? 'primary' : 'secondary'} className={styles.visibilityBadge}>
                                            {meal.visibility === 'public' ? t('meals.visibility.public') : t('meals.visibility.private')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className={styles.mealInfo}>
                                    <div className={styles.infoItem}>
                                        <FaCalendarAlt className={styles.infoIcon} />
                                        <span>{new Date(meal.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <FaClock className={styles.infoIcon} />
                                        <span>{new Date(meal.date).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <FaUsers className={styles.infoIcon} />
                                        <span>{t('meals.detail.participants', { count: meal.participants?.length || 0, max: meal.maxParticipants })}</span>
                                    </div>
                                    {meal.topic && (
                                        <div className={styles.infoItem}>
                                            <FaTag className={styles.infoIcon} />
                                            <span>{meal.topic}</span>
                                        </div>
                                    )}
                                </div>

                                {meal.description && (
                                    <div className={styles.description}>
                                        <h4>{t('meals.detail.description')}</h4>
                                        <p>{meal.description}</p>
                                    </div>
                                )}

                                {renderActionButtons()}
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
                                        src={getHostAvatarUrl(meal.host)} 
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
                                    <h4>{t('meals.detail.participants')}</h4>
                                </Card.Header>
                                <Card.Body>
                                    <div className={styles.participantsList}>
                                        {meal.participants.map((participant, index) => (
                                            <div key={participant.id || index} className={styles.participant}>
                                                <img 
                                                    src={getHostAvatarUrl(participant)} 
                                                    alt={t('meals.detail.participantAvatarAlt')}
                                                    className={styles.participantAvatar}
                                                />
                                                <span>{participant.name} {participant.surname}</span>
                                            </div>
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
                onHide={() => setShowLeaveModal(false)}
                onSubmit={handleLeaveMealWithReason}
                title={t('meals.detail.leaveReportTitle')}
            />
        </Container>
    );
};

export default MealDetailPage;