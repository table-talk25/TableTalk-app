// File: src/pages/PublicProfile/index.js (Versione con Layout Finale)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService';
import styles from './PublicProfilePage.module.css';
import { Container, Row, Col, Card, Spinner, Alert, Button, Badge, Accordion } from 'react-bootstrap';
import { FaBirthdayCake, FaMapMarkerAlt, FaHeart, FaUtensils, FaStar, FaComments, FaGlobe } from 'react-icons/fa';
import PersonalInfo from '../../components/profile/PersonalInfo';
import InterestsSection from '../../components/profile/InterestsSection';
import MealCard from '../../components/meals/MealCard';
import BackButton from '../../components/common/BackButton';

const PublicProfilePage = () => {
    const { userId } = useParams();
    const { user: loggedInUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isOwner = loggedInUser?._id === userId;

    const fetchPublicProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const profileData = await profileService.getPublicProfileById(userId);
            setProfile(profileData);
        } catch (err) {
            setError(err.message || 'Impossibile caricare il profilo.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchPublicProfile();
    }, [fetchPublicProfile]);

    if (loading) return <Container className="text-center py-5"><Spinner animation="border" /></Container>;
    if (error || !profile) return <Container className="text-center py-5"><Alert variant="danger">{error || 'Impossibile caricare il profilo.'}</Alert></Container>;

    const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

        // Filtriamo i TableTalk® a cui l'utente ha partecipato escludendo quelli che ha organizzato lui stesso
        const participatedMeals = profile.joinedMeals?.filter(
            joinedMeal => !profile.createdMeals?.some(createdMeal => createdMeal._id === joinedMeal._id)
          ) || [];

    return (
        <div className={styles.profilePageBackground}>
            <Container className={styles.profileContainer}>
                {/* Header con Immagine e Nickname */}
                <header className={styles.profileHeader}>
                    <img
                        src={profileService.getFullImageUrl(profile.profileImage)}
                        alt={profile.nickname}
                        className={styles.profileAvatar}
                    />
                    <div className={styles.headerInfo}>
                        <h1>{profile.nickname}</h1>
                        {isOwner && (
                            <Button as={Link} to="/impostazioni/profilo" variant="secondary" size="sm">
                                Modifica Profilo
                            </Button>
                        )}
                    </div>
                </header>

                {/* Contenuto principale a due colonne */}
                <main className={styles.profileContent}>
                    <Row>
                        {/* Colonna Sinistra: Dettagli e Interessi */}
                        <Col lg={4} className={styles.leftColumn}>
                            <Card className={styles.infoCard}>
                                <Card.Body>
                                    <Card.Title className={styles.cardTitle}>In Breve</Card.Title>
                                    {profile.location && <div className={styles.detailItem}><FaMapMarkerAlt /> Da <strong>{profile.location}</strong></div>}
                                    {profile.age && <div className={styles.detailItem}><FaBirthdayCake /> <strong>{profile.age}</strong> anni</div>}
                                    {profile.gender && <div className={styles.detailItem}>Genere: <strong>{capitalize(profile.gender)}</strong></div>}
                                    
                                    <hr />
                                    <h5 className={styles.detailSubtitle}><FaComments /> Lingue</h5>
                                    <div className={styles.tagsContainer}>
                                        {profile.languages?.length > 0
                                            ? profile.languages.map(lang => <Badge key={lang} pill bg="success" className={styles.tag}>{lang}</Badge>)
                                            : <p className="text-muted small">Nessuna lingua specificata.</p>}
                                    </div>

                                    <hr />
                                    <h5 className={styles.detailSubtitle}><FaUtensils /> Cucina Preferita</h5>
                                    {profile.preferredCuisine 
                                      ? <Badge pill bg="warning" text="dark" className={styles.tag}>{profile.preferredCuisine}</Badge>
                                      : <p className="text-muted small">Nessuna preferenza.</p>}

                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Colonna Destra: Bio e TableTalk® con Accordion */}
                        <Col lg={8} className={styles.rightColumn}>
                             <Card className={styles.infoCard}>
                                <Card.Body>
                                    <h2 className={styles.sectionTitle}><FaHeart /> Chi sono</h2>
                                    <p className={styles.bioText}>{profile.bio || 'Nessuna biografia inserita.'}</p>
                                </Card.Body>
                            </Card>
                            
                            {/* 2. NUOVA SEZIONE TABLETALK® CON ACCORDION */}
                            <div className={styles.accordionSection}>
                                <Accordion>
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>
                                            TableTalk Organizzati ({profile.createdMeals?.length || 0})
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            {profile.createdMeals?.length > 0 ? (
                                                <ul className={styles.mealList}>
                                                    {profile.createdMeals.map(meal => (
                                                        <li key={meal._id}>
                                                            <Link to={`/meals/${meal._id}`} className={styles.mealLink}>
                                                                <span className={styles.mealTitle}>{meal.title}</span>
                                                                <span className={styles.mealDate}>{new Date(meal.date).toLocaleDateString('it-IT')}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="text-muted small">Questo utente non ha ancora organizzato TableTalk.</p>}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                    <Accordion.Item eventKey="1">
                                        <Accordion.Header>
                                            Partecipazioni Recenti ({participatedMeals.length})
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            {participatedMeals.length > 0 ? (
                                                <ul className={styles.mealList}>
                                                    {participatedMeals.map(meal => (
                                                        <li key={meal._id}>
                                                            <Link to={`/meals/${meal._id}`} className={styles.mealLink}>
                                                                <span className={styles.mealTitle}>{meal.title}</span>
                                                                <span className={styles.mealDate}>{new Date(meal.date).toLocaleDateString('it-IT')}</span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="text-muted small">Questo utente non ha partecipato a nessun TableTalk.</p>}
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </div>
                        </Col>
                    </Row>
                </main>
            </Container>
        </div>
    );
};

export default PublicProfilePage;
                            