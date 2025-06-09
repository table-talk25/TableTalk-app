import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import axiosInstance from '../../config/axiosConfig';
import '../../styles/RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
  });
  
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;

    if (!formData.email.trim()) {
      tempErrors.email = "L'email è obbligatoria";
      formIsValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email non valida";
      formIsValid = false;
    }

    if (!formData.password) {
      tempErrors.password = "La password è obbligatoria";
      formIsValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = "La password deve essere di almeno 6 caratteri";
      formIsValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Le password non coincidono";
      formIsValid = false;
    }

    if (!formData.name.trim()) {
      tempErrors.name = "Il nome è obbligatorio";
      formIsValid = false;
    }

    if (!formData.surname.trim()) {
      tempErrors.surname = "Il cognome è obbligatorio";
      formIsValid = false;
    }

    setErrors(tempErrors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Sending registration data:', { 
        email: formData.email,
        password: formData.password,
        name: formData.name,
        surname: formData.surname,
      });
      
      const response = await axiosInstance.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        surname: formData.surname,
      });
      
      console.log('Registration successful:', response);

      // Salva il token nel localStorage
      localStorage.setItem('token', response.data.token);
      
      // Reindirizza alla pagina del profilo
      navigate('/profile', { 
        state: { 
          message: 'Registrazione completata con successo! Completa il tuo profilo.' 
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore durante la registrazione. Riprova più tardi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="text-center">Registrati su TableTalk</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!errors.name}
              required
            />
            {errors.name && (
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cognome</Form.Label>
            <Form.Control
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              isInvalid={!!errors.surname}
              required
            />
            {errors.surname && (
              <Form.Control.Feedback type="invalid">
                {errors.surname}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
              required
            />
            {errors.email && (
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!errors.password}
              required
            />
            {errors.password && (
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Conferma Password</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              isInvalid={!!errors.confirmPassword}
              required
            />
            {errors.confirmPassword && (
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mb-3"
            disabled={isLoading}
          >
            {isLoading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
          
          <div className="text-center">
            <p className="mb-0">
              Hai già un account? <Link to="/login">Accedi</Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;