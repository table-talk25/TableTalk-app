import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import profileService from '../../services/profileService';
import { FaBirthdayCake, FaMapMarkerAlt, FaHeart, FaUtensils, FaGlobe } from 'react-icons/fa';

const PublicProfileModal = ({ show, userId, onClose, onInvite }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show || !userId) return;
    setLoading(true);
    setError('');
    profileService.getPublicProfileById(userId)
      .then(setProfile)
      .catch(err => setError(err.message || 'Impossibile caricare il profilo.'))
      .finally(() => setLoading(false));
  }, [show, userId]);

  const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Profilo pubblico</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /></div>
        ) : error || !profile ? (
          <Alert variant="danger">{error || 'Impossibile caricare il profilo.'}</Alert>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <img
                src={profileService.getFullImageUrl(profile.profileImage)}
                alt={profile.nickname}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginRight: 16 }}
              />
              <div>
                <h4 style={{ margin: 0 }}>{profile.nickname}</h4>
                {profile.location && (
                  <div><FaMapMarkerAlt /> <span>Da <strong>{profile.location}</strong></span></div>
                )}
                {profile.age && (
                  <div><FaBirthdayCake /> <span>{profile.age} anni</span></div>
                )}
                {profile.gender && (
                  <div>Genere: <strong>{capitalize(profile.gender)}</strong></div>
                )}
              </div>
            </div>
            <hr />
            <h5><FaHeart /> Chi sono</h5>
            <p>{profile.bio || 'Nessuna biografia inserita.'}</p>
            <h5><FaGlobe /> Argomenti preferiti</h5>
            <div>
              {profile.interests?.length > 0
                ? profile.interests.map(interest => <Badge key={interest} pill bg="info" style={{ marginRight: 4 }}>{interest}</Badge>)
                : <span className="text-muted small">Nessun interesse specificato.</span>}
            </div>
            <h5 className="mt-3"><FaUtensils /> Cucina preferita</h5>
            {profile.preferredCuisine
              ? <Badge pill bg="warning" text="dark">{profile.preferredCuisine}</Badge>
              : <span className="text-muted small">Nessuna preferenza.</span>}
            <h5 className="mt-3">Lingue</h5>
            <div>
              {profile.languages?.length > 0
                ? profile.languages.map(lang => <Badge key={lang} pill bg="success" style={{ marginRight: 4 }}>{lang}</Badge>)
                : <span className="text-muted small">Nessuna lingua specificata.</span>}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Chiudi</Button>
        {!loading && !error && profile && (
          <Button variant="primary" onClick={() => onInvite(profile)} disabled={!profile}>Invita</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PublicProfileModal; 