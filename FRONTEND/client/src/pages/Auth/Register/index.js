// File: frontend/client/src/pages/Auth/RegisterPage.js (Versione Finale)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, InputGroup, FormCheck } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '', terms: false });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked  } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});


        try {
            await register({ ...formData });
            toast.success('Registrazione avvenuta con successo!');
            navigate('/impostazioni/profilo', { state: { message: 'Benvenuto/a! Completa il tuo profilo.' } });
        } catch (err) {
            if (err.errors && err.errors.length > 0) {
                const backendErrors = {};
                err.errors.forEach(error => {
                    if(error.path) { backendErrors[error.path] = error.msg; }
                });
                setErrors(backendErrors);
                toast.error('Per favore, correggi gli errori nel modulo.');
            } else {
                toast.error(err.message || 'Errore durante la registrazione.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h2 className={styles.title}>Crea il tuo Account</h2>
                <Form onSubmit={handleSubmit} noValidate>
                    <Form.Group className="mb-3">
                        <Form.Label className={styles.formLabel}>Nome</Form.Label>
                        <Form.Control className={styles.formInput} type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!errors.name} required />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>
                          <Form.Group className="mb-3">
                        <Form.Label className={styles.formLabel}>Cognome</Form.Label>
                        <Form.Control className={styles.formInput} type="text" name="surname" value={formData.surname} onChange={handleChange} isInvalid={!!errors.surname} required />
                        <Form.Control.Feedback type="invalid">{errors.surname}</Form.Control.Feedback>
                    </Form.Group>
                     <Form.Group className="mb-3">
                        <Form.Label className={styles.formLabel}>Email</Form.Label>
                        <Form.Control className={styles.formInput} type="email" name="email" value={formData.email} onChange={handleChange} isInvalid={!!errors.email} required />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
    
                    <Form.Group className="mb-3">
                        <Form.Label className={styles.formLabel}>Password</Form.Label>
                        <InputGroup hasValidation>
                            <Form.Control className={styles.formInput} type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} isInvalid={!!errors.password} required />
                            <InputGroup.Text onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle}>{showPassword ? <FaEyeSlash /> : <FaEye />}</InputGroup.Text>
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>
                    
                    <div className={styles.passwordRequirements}>
                        <ul><li>Almeno 8 caratteri, con maiuscola, minuscola, numero e simbolo.</li></ul>
                    </div>
                    
                    <Form.Group>
                        <Form.Label className={styles.formLabel}>Conferma Password</Form.Label>
                        <Form.Control className={styles.formInput} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} isInvalid={!!errors.confirmPassword} required />
                        <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                    </Form.Group>
    
                    <Form.Group className={styles.termsContainer}>
                        <FormCheck 
                            id="terms-checkbox"
                            name="terms"
                            checked={formData.terms}
                            onChange={handleChange}
                            isInvalid={!!errors.terms}
                            feedback={errors.terms}
                            feedbackType="invalid"
                        />
                        <div className={styles.termsLabel}>
                        Dichiaro di aver letto e di accettare i 
                            <Link to="/termini-e-condizioni" target="_blank" rel="noopener noreferrer"> Termini di Servizio</Link> e la 
                            <Link to="/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</Link>.
                            </div>
                            </Form.Group>

                    <Button type="submit" className={styles.submitButton} disabled={isLoading || !formData.terms}>
                        {isLoading ? 'Registrazione...' : 'Registrati'}
                    </Button>
    
                    <div className={styles.bottomLink}>
                        Hai già un account? <Link to="/login">Accedi</Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default RegisterPage;