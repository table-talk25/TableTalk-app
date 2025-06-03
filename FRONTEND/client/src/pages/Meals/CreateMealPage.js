import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-hot-toast';
import { createMeal } from '../../services/mealService';
import '../../styles/CreateMealPage.css';

const MEAL_TYPE_TRANSLATIONS = {
  'colazione': 'Colazione',
  'pranzo': 'Pranzo',
  'cena': 'Cena',
  'aperitivo': 'Aperitivo'
};

const MEAL_TYPES = ['colazione', 'pranzo', 'cena', 'aperitivo'];

const CreateMealPage = () => {
  const navigate = useNavigate();
  const VALID_LANGUAGES = ['Italiano', 'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية'];
  
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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Validazione del form
  useEffect(() => {
    const validateForm = () => {
      const { title, type, date, maxParticipants, description, language, topics, duration } = formData;
      
      const minDate = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 14);

      const validations = {
        title: title.trim().length >= 10,
        type: MEAL_TYPES.includes(type),
        date: date instanceof Date && !isNaN(date.getTime()) && date > minDate && date <= maxDate,
        maxParticipants: Number.isInteger(maxParticipants) && maxParticipants >= 2 && maxParticipants <= 10,
        description: description.trim().length >= 10,
        language: VALID_LANGUAGES.includes(language),
        topics: topics.length >= 1 && topics.length <= 5 && topics.every(topic => 
          typeof topic === 'string' && topic.trim().length >= 2 && topic.trim().length <= 50
        ),
        duration: !duration || (Number.isInteger(duration) && duration >= 15 && duration <= 180)
      };
      
      console.log('Stato attuale dell\'oggetto validations:', validations); 

      const isValid = Object.values(validations).every(v => v === true);
      setIsFormValid(isValid);
    
            // Debug della validazione
            console.log('🔍 Validazione form:', {
              validations,
              isValid,
              formData: {
                title: title.trim(),
                type,
                date,
                maxParticipants: Number(maxParticipants),
                description: description.trim(),
                language,
                topics,
                duration
              }
            });
          };
          
    validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      let processedValue;

      if (type === 'checkbox') {
        // Gestione specifica per i checkbox nelle settings
        if (name.startsWith('settings.')) {
          const settingName = name.split('.')[1];
          return {
            ...prev,
            settings: {
              ...prev.settings,
              [settingName]: checked
            }
          };
        }
        processedValue = checked;
      } else if (name === 'maxParticipants' || type === 'number') {
        // Gestione campi numerici
        processedValue = value === '' ? '' : Number(value);
      } else {
        // Per tutti gli altri input (text, select, textarea)
        processedValue = value;
      }
      
      return { ...prev, [name]: processedValue };
    });
  };

  const handleDateChange = (date) => {
    if (date) {
      setFormData(prev => ({ ...prev, date: date }));
    }
  };

  const handleTopicAdd = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const topic = e.target.value.trim();
      
      // Verifica la lunghezza dell'argomento
      if (topic.length < 2 || topic.length > 50) {
        toast.error('L\'argomento deve essere tra 2 e 50 caratteri');
        return;
      }

      // Verifica il numero massimo di argomenti
      if (formData.topics.length >= 5) {
        toast.error('Puoi aggiungere al massimo 5 argomenti');
        return;
      }

      // Verifica duplicati
      if (formData.topics.includes(topic)) {
        toast.error('Questo argomento è già stato aggiunto');
        return;
      }

      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
      e.target.value = '';
    }
  };

  const handleTopicRemove = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Tentativo di invio form:', { isFormValid, formData });
    
    if (!isFormValid) {
      const errorMessage = 'Per favore, compila correttamente tutti i campi obbligatori';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mealData = {
        ...formData,
        date: formData.date.toISOString(),
        maxParticipants: parseInt(formData.maxParticipants, 10),
        status: 'pianificato',
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type.toLowerCase(),
        language: formData.language,
        topics: formData.topics,
        duration: parseInt(formData.duration, 10) || 120,
        settings: {
          allowLateJoin: Boolean(formData.settings.allowLateJoin),
          requireApproval: Boolean(formData.settings.requireApproval),
          videoQuality: formData.settings.videoQuality || 'HD',
          backgroundBlur: Boolean(formData.settings.backgroundBlur)
        }
      };

      console.log('📤 Dati da inviare:', mealData);

      const response = await createMeal(mealData);
      
      console.log('📥 Risposta ricevuta:', response);

      if (!response || !response._id) {
        throw new Error('Il server non ha restituito un pasto valido');
      }

      toast.success('Pasto virtuale creato con successo! 🎉');
      navigate(`/meals/${response._id}`);
      
    } catch (err) {
      console.error('❌ Errore durante la creazione del pasto:', err);

      let errorMessage = 'Si è verificato un errore durante la creazione del pasto';

       // Gestisci diversi tipi di errore
       if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calcola la data minima (non puoi creare un pasto nel passato)
  const minDate = new Date();
  
  // Calcola la data massima (max 2 settimane nel futuro)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  return (
    <div className="create-meal-page">
      <div className="create-meal-header">
        <h1 className="create-meal-title">Crea un nuovo pasto virtuale</h1>
        <p className="create-meal-subtitle">
          Organizza un pasto virtuale e connettiti con persone che condividono i tuoi interessi
        </p>
      </div>

      <div className="create-meal-content">
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-meal-form">
          <div className="form-section">
            <h2>Informazioni Base</h2>
            <div className="form-group">
              <label htmlFor="title">Titolo del Pasto Virtuale*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Es. Cena italiana di venerdì sera"
                required
                maxLength={100}
                className={formData.title.trim().length > 0 && formData.title.trim().length < 10 ? 'is-invalid' : ''}
              />
              <small className="form-text">
                Minimo 10 caratteri ({formData.title.length}/100)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descrizione*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descrivi il tuo pasto virtuale. Di cosa vorresti parlare? C'è un tema specifico? Chi vorresti conoscere?"
                required
                maxLength={1000}
                className={formData.description.trim().length > 0 && formData.description.trim().length < 10 ? 'is-invalid' : ''}
              />
              <small className="form-text">
                Minimo 10 caratteri, massimo 1000 ({formData.description.length}/1000)
              </small>
            </div>
          </div>

          <div className="form-section">
            <h2>Dettagli dell'Evento</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Tipo di Pasto*</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  {MEAL_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type === 'colazione' ? '🥐 Colazione' :
                       type === 'pranzo' ? '🍽️ Pranzo' :
                       type === 'cena' ? '🍷 Cena' :
                       '🍹 Aperitivo'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="language">Lingua Principale*</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                >
                  {VALID_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'Italiano' ? '🇮🇹 Italiano' :
                       lang === 'English' ? '🇬🇧 English' :
                       lang === 'Español' ? '🇪🇸 Español' :
                       lang === 'Français' ? '🇫🇷 Français' :
                       lang === 'Deutsch' ? '🇩🇪 Deutsch' :
                       lang === '中文' ? '🇨🇳 中文' :
                       '🇸🇦 العربية'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Data e Ora*</label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="dd/MM/yyyy HH:mm"
                  minDate={minDate}
                  maxDate={maxDate}
                  className="form-control"
                  required
                  placeholderText="Seleziona data e ora"
                />
                <small className="form-text">
                  La data deve essere tra oggi e 2 settimane nel futuro
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="maxParticipants">Numero Massimo di Partecipanti*</label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min={2}
                  max={10}
                  step={1}
                  required
                  className={!Number.isInteger(formData.maxParticipants) || formData.maxParticipants < 2 || formData.maxParticipants > 10 ? 'is-invalid' : ''}
                />
                <small className="form-text">
                  Numero di partecipanti tra 2 e 10 (attuale: {formData.maxParticipants})
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Durata (minuti)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min={15}
                max={180}
                step={1}
              />
              <small className="form-text">
                Durata opzionale tra 15 e 180 minuti (predefinito: 120 minuti)
              </small>
            </div>
          </div>

          <div className="form-section">
            <h2>Argomenti di Conversazione</h2>
            <div className="form-group">
              <label>
                Argomenti* 
                <span className="text-muted">({formData.topics.length}/5)</span>
              </label>
              <input
                type="text"
                placeholder="Inserisci un argomento (2-50 caratteri) e premi Invio"
                onKeyPress={handleTopicAdd}
                maxLength={50}
              />
              <small className="form-text">
                Aggiungi da 1 a 5 argomenti di conversazione (premi Invio per aggiungere)
              </small>
              <div className="topics-container">
                {formData.topics.map((topic, index) => (
                  <span 
                    key={index} 
                    className="topic-badge"
                    onClick={() => handleTopicRemove(index)}
                  >
                    {topic} <i className="fas fa-times"></i>
                  </span>
                ))}
              </div>
            </div>
          </div>

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

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/meals')}
              disabled={loading}
            >
              <i className="fas fa-times me-2"></i>
              Annulla
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Creazione in corso...
                </>
              ) : (
                <>
                  <i className="fas fa-plus me-2"></i>
                  Crea Pasto Virtuale
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMealPage; 