import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Container, Form, Button } from 'react-bootstrap';

const EditMealPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    type: 'cena',
    date: new Date(new Date().setHours(new Date().getHours() + 2)),
    maxParticipants: 4,
    description: '',
    language: 'Italiano',
    topics: [],
    duration: 120,
    settings: {
      allowLateJoin: true,
      requireApproval: false,
      videoQuality: 'HD',
      backgroundBlur: true
    }
  });

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const response = await fetch(`/api/meals/${id}`);
        const data = await response.json();
        
        setFormData({
          title: data.title,
          description: data.description,
          type: data.type,
          language: data.language,
          date: data.date,
          maxParticipants: data.maxParticipants,
          duration: data.duration,
          topics: data.topics || [],
          settings: data.settings || {
            allowLateJoin: true,
            requireApproval: false,
            videoQuality: 'HD',
            backgroundBlur: true
          }
        });
      } catch (error) {
        console.error('Errore nel caricamento del pasto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        navigate(`/meals/${id}`);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del pasto:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Se è un campo numerico, converti il valore
    if (type === 'number' || name === 'maxParticipants' || name === 'duration') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSettingsChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: checked
      }
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Per favore effettua il login per modificare un pasto.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <Container className="edit-meal-page py-4">
      <h2 className="text-center mb-4">Modifica Pasto</h2>
      <Form onSubmit={handleSubmit}>
        {/* Titolo */}
        <Form.Group className="mb-3">
          <Form.Label>Titolo</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Descrizione */}
        <Form.Group className="mb-3">
          <Form.Label>Descrizione</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Data e Ora */}
        <Form.Group className="mb-3">
          <Form.Label>Data e Ora</Form.Label>
          <Form.Control
            type="datetime-local"
            name="date"
            value={formData.date.toISOString().split('T')[0] + 'T' + formData.date.toISOString().split('T')[1]}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Tipo di pasto */}
        <Form.Group className="mb-3">
          <Form.Label>Tipo di pasto</Form.Label>
          <Form.Select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona tipo</option>
            <option value="colazione">Colazione</option>
            <option value="pranzo">Pranzo</option>
            <option value="cena">Cena</option>
            <option value="aperitivo">Aperitivo</option>
          </Form.Select>
        </Form.Group>

        {/* Lingua */}
        <Form.Group className="mb-3">
          <Form.Label>Lingua</Form.Label>
          <Form.Select
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona lingua</option>
            <option value="Italiano">Italiano</option>
            <option value="English">Inglese</option>
            <option value="Español">Spagnolo</option>
            <option value="Français">Francese</option>
            <option value="Deutsch">Tedesco</option>
          </Form.Select>
        </Form.Group>

        {/* Argomenti */}
        <Form.Group className="mb-3">
          <Form.Label>Argomenti (max 5)</Form.Label>
          <Form.Control
            type="text"
            name="topics"
            value={formData.topics.join(', ')}
            onChange={(e) => {
              const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t);
              setFormData(prev => ({
                ...prev,
                topics: topics.slice(0, 5)
              }));
            }}
            placeholder="Inserisci gli argomenti separati da virgola"
            required
          />
          <Form.Text className="text-muted">
            Inserisci fino a 5 argomenti separati da virgola
          </Form.Text>
        </Form.Group>

        {/* Numero massimo partecipanti */}
        <Form.Group className="mb-3">
          <Form.Label>Numero massimo partecipanti</Form.Label>
          <Form.Control
            type="number"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            min={2}
            max={10}
            required
          />
        </Form.Group>

        {/* Durata */}
        <Form.Group className="mb-3">
          <Form.Label>Durata (minuti)</Form.Label>
          <Form.Control
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min={15}
            max={180}
            required
          />
        </Form.Group>

        {/* Impostazioni */}
        <div className="form-section">
          <h2>Impostazioni Video</h2>
          <div className="settings-group">
            <div className="form-group">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={formData.settings.backgroundBlur}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        backgroundBlur: e.target.checked
                      }
                    }));
                  }}
                />
                <span>🎥 Sfoca lo sfondo</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="videoQuality">Qualità Video</label>
              <select
                id="videoQuality"
                value={formData.settings.videoQuality}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      videoQuality: e.target.value
                    }
                  }));
                }}
              >
                <option value="SD">SD (Standard)</option>
                <option value="HD">HD (Alta definizione)</option>
                <option value="FullHD">FullHD (Full HD)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={formData.settings.allowLateJoin}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        allowLateJoin: e.target.checked
                      }
                    }));
                  }}
                />
                <span>🚪 Permetti l'ingresso tardivo</span>
              </label>
            </div>

            <div className="form-group">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={formData.settings.requireApproval}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        requireApproval: e.target.checked
                      }
                    }));
                  }}
                />
                <span>✅ Richiedi approvazione per partecipare</span>
              </label>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Annulla
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditMealPage; 