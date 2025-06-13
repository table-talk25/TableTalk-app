// File: frontend/client/src/pages/Auth/RegisterPage.js (Versione Finale e Completa)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../../styles/RegisterPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isAuthenticated) navigate('/profile');
    }, [isAuthenticated, navigate]);

    // --- FUNZIONE DI VALIDAZIONE COMPLETA ---
    const validateForm = () => {
        const newErrors = {};
        
        // Validazione Nome
        if (!formData.name) newErrors.name = 'Il nome è obbligatorio.';
        else if (!/^[a-zA-Z\s]*$/.test(formData.name)) newErrors.name = 'Il nome può contenere solo lettere e spazi.';

        // Validazione Cognome
        if (!formData.surname) newErrors.surname = 'Il cognome è obbligatorio.';
        else if (!/^[a-zA-Z\s]*$/.test(formData.surname)) newErrors.surname = 'Il cognome può contenere solo lettere e spazi.';

        // Validazione Email
        if (!formData.email) newErrors.email = 'L\'email è obbligatoria.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Inserisci un\'email valida.';

        // Validazione Password
        const isPasswordValid = 
            formData.password.length >= 8 &&
            /[A-Z]/.test(formData.password) &&
            /[a-z]/.test(formData.password) &&
            /\d/.test(formData.password) &&
            /[@$!%*?&]/.test(formData.password);

        if (!formData.password) newErrors.password = 'La password è obbligatoria.';
        else if (!isPasswordValid) newErrors.password = 'La password non rispetta tutti i requisiti.';
        
        // Validazione Conferma Password
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Le password non coincidono.';
        }

        setErrors(newErrors);
        // Il form è valido solo se l'oggetto degli errori è vuoto
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Pulisce l'errore per quel campo non appena l'utente inizia a correggere
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Eseguiamo la nostra validazione completa prima di inviare
        if (!validateForm()) {
            toast.error('Per favore, correggi gli errori nel modulo.');
            return;
        }
        
        setIsLoading(true);
        try {
            await register({
                name: formData.name,
                surname: formData.surname,
                email: formData.email,
                password: formData.password,
            });
            toast.success('Registrazione avvenuta con successo!');
            navigate('/profile', { state: { message: 'Benvenuto/a! Completa il tuo profilo.' } });
        } catch (err) {
            // Gestisce errori specifici dal backend (es. email già in uso)
            toast.error(err.message || 'Errore durante la registrazione.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <h2 className="text-center">Crea il tuo Account</h2>
                <Form onSubmit={handleSubmit} noValidate>
                    {/* Campi con validazione specifica di Bootstrap */}
                    <Form.Group className="mb-3">
                        <Form.Label>Nome</Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!errors.name} required />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Cognome</Form.Label>
                        <Form.Control type="text" name="surname" value={formData.surname} onChange={handleChange} isInvalid={!!errors.surname} required />
                        <Form.Control.Feedback type="invalid">{errors.surname}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} isInvalid={!!errors.email} required />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <InputGroup hasValidation>
                            <Form.Control type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} isInvalid={!!errors.password} required />
                            <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>{showPassword ? <FaEyeSlash /> : <FaEye />}</InputGroup.Text>
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>
                    
                    <div className="password-requirements">
                        <ul>
                            <li>Almeno 8 caratteri</li>
                            <li>Una maiuscola, una minuscola, un numero e un carattere speciale (@$!%*?&)</li>
                        </ul>
                    </div>

                    <Form.Group className="mb-4">
                        <Form.Label>Conferma Password</Form.Label>
                        <InputGroup hasValidation>
                            <Form.Control type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} isInvalid={!!errors.confirmPassword} required />
                            <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</InputGroup.Text>
                            <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-3" disabled={isLoading}>
                        {isLoading ? 'Registrazione...' : 'Registrati'}
                    </Button>
                    
                    <div className="text-center"><p className="mb-0">Hai già un account? <Link to="/login">Accedi</Link></p></div>
                </Form>
            </div>
        </div>
    );
};

export default RegisterPage;