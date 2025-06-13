import React from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import '../../styles/MealFilters.css';
import { useMeals } from '../../contexts/MealsContext';

const MEAL_TYPE_TRANSLATIONS = {
  'colazione': 'Colazione',
  'pranzo': 'Pranzo',
  'cena': 'Cena',
  'aperitivo': 'Aperitivo'
};

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

const MealFilters = () => {
  const { filters, setFilters } = useMeals();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="filters">
      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Tipo Pasto</Form.Label>
            <Form.Select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">Tutti</option>
              <option value="breakfast">Colazione</option>
              <option value="lunch">Pranzo</option>
              <option value="dinner">Cena</option>
              <option value="snack">Spuntino</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Stato</Form.Label>
            <Form.Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tutti</option>
              <option value="open">Aperti</option>
              <option value="full">Completi</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completati</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Ordina per</Form.Label>
            <Form.Select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="date">Data</option>
              <option value="participants">Partecipanti</option>
              <option value="price">Prezzo</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default MealFilters; 