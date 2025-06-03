import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import '../../styles/MealFilters.css';

const MEAL_TYPE_TRANSLATIONS = {
  'colazione': 'Colazione',
  'pranzo': 'Pranzo',
  'cena': 'Cena',
  'aperitivo': 'Aperitivo'
};

const MEAL_TYPES = ['colazione', 'pranzo', 'cena', 'aperitivo'];

const LANGUAGE_TRANSLATIONS = {
  'Italiano': 'Italiano',
  'English': 'Inglese',
  'Español': 'Spagnolo',
  'Français': 'Francese',
  'Deutsch': 'Tedesco',
  '中文': 'Cinese',
  'العربية': 'Arabo'
};

const STATUS_TRANSLATIONS = {
  pianificato: 'upcoming',
  'in corso': 'ongoing',
  completato: 'completed',
  cancellato: 'cancelled'
};

const MealFilters = ({ filters, onFilterChange, onSearch, onSort, onReset }) => {
  const handleTypeChange = (e) => {
    const value = e.target.value;
    onFilterChange('type', value ? MEAL_TYPE_TRANSLATIONS[value] : '');
  };

  const handleDateChange = (e) => {
    onFilterChange({ date: e.target.value });
  };

  const handleLanguageChange = (e) => {
    const value = e.target.value;
    onFilterChange('language', value ? LANGUAGE_TRANSLATIONS[value] : '');
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    onFilterChange('status', value ? STATUS_TRANSLATIONS[value] : '');
  };

  const handleSearchChange = (e) => {
    onSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split('-');
    onSort(sortBy, sortOrder);
  };

  return (
    <Card className="filters-card">
      <Card.Header>
        <h5 className="mb-0">
          <FaFilter className="me-2" />
          Filtri
        </h5>
      </Card.Header>
      <Card.Body>
        <Form>
          {/* Ricerca */}
          <Form.Group className="mb-3">
            <Form.Label>
              <FaSearch className="me-2" />
              Cerca
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Cerca per titolo..."
              onChange={handleSearchChange}
              value={filters.search || ''}
            />
          </Form.Group>

          {/* Tipo di pasto */}
          <Form.Group className="mb-3">
            <Form.Label>Tipo di pasto</Form.Label>
            <Form.Select onChange={handleTypeChange} value={filters.type || ''}>
              <option value="">Tutti i tipi</option>
              <option value="colazione">🥐 Colazione</option>
              <option value="pranzo">🍽️ Pranzo</option>
              <option value="cena">🍷 Cena</option>
              <option value="aperitivo">🍹 Aperitivo</option>
            </Form.Select>
          </Form.Group>

          {/* Data */}
          <Form.Group className="mb-3">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              onChange={handleDateChange}
              value={filters.date || ''}
            />
          </Form.Group>

          {/* Lingua */}
          <Form.Group className="mb-3">
            <Form.Label>Lingua</Form.Label>
            <Form.Select onChange={handleLanguageChange} value={filters.language || ''}>
              <option value="">Tutte le lingue</option>
              <option value="Italiano">🇮🇹 Italiano</option>
              <option value="English">🇬🇧 Inglese</option>
              <option value="Español">🇪🇸 Spagnolo</option>
              <option value="Français">🇫🇷 Francese</option>
              <option value="Deutsch">🇩🇪 Tedesco</option>
              <option value="中文">🇨🇳 Cinese</option>
              <option value="العربية">🇸🇦 Arabo</option>
            </Form.Select>
          </Form.Group>

          {/* Stato */}
          <Form.Group className="mb-3">
            <Form.Label>Stato</Form.Label>
            <Form.Select onChange={handleStatusChange} value={filters.status || ''}>
              <option value="">Tutti gli stati</option>
              <option value="pianificato">Pianificato</option>
              <option value="in corso">In corso</option>
              <option value="completato">Completato</option>
              <option value="cancellato">Cancellato</option>
            </Form.Select>
          </Form.Group>

          {/* Ordinamento */}
          <Form.Group className="mb-3">
            <Form.Label>
              <FaSort className="me-2" />
              Ordina per
            </Form.Label>
            <Form.Select onChange={handleSortChange} value={`${filters.sortBy || ''}-${filters.sortOrder || ''}`}>
              <option value="">Predefinito</option>
              <option value="date-asc">Data (più recente)</option>
              <option value="date-desc">Data (meno recente)</option>
              <option value="participants-asc">Partecipanti (crescente)</option>
              <option value="participants-desc">Partecipanti (decrescente)</option>
            </Form.Select>
          </Form.Group>

          {/* Reset filtri */}
          <Button 
            variant="outline-secondary" 
            className="w-100"
            onClick={onReset}
          >
            Reset filtri
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MealFilters; 