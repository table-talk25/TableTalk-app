// File: /pages/Auth/Login/index.js (Versione Corretta)

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Logo from '../../../components/common/Logo';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // =======================================================
    // === LA SOLA RIGA DA MODIFICARE È QUESTA:             ===
    // =======================================================
    const from = location.state?.from?.pathname || '/impostazioni/profilo';

    try {
      await login(formData); 
      navigate(from, { replace: true });
    
    } catch (err) {
      console.error('Errore durante il login:', err);
      setError(err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
        <div className={styles.card}>
            <div className={styles.logoContainer}>
                <Link to="/" className={styles.logoLink}>
                    <Logo />
                </Link>
            </div>
            <h2 className={styles.title}>{t('auth.loginToTableTalk')}</h2>
            
            {location.state?.message && <Alert variant="success">{location.state.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label className={styles.formLabel}>{t('auth.email')}</Form.Label>
                    <Form.Control
                        className={styles.formInput}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('auth.emailPlaceholder')}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className={styles.formLabel}>{t('auth.password')}</Form.Label>
                    <InputGroup>
                        <Form.Control
                            className={styles.formInput}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t('auth.passwordPlaceholder')}
                            required
                        />
                        <InputGroup.Text
                            onClick={() => setShowPassword(!showPassword)}
                            className={styles.passwordToggle}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </InputGroup.Text>
                    </InputGroup>
                </Form.Group>

                <Button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isLoading}
                >
                    {isLoading ? t('auth.loggingIn') : t('auth.login')}
                </Button>
            </Form>

            <div className={styles.links}>
                <Link to="/forgot-password" className={styles.link}>
                    {t('auth.forgotPassword')}
                </Link>
                <Link to="/register" className={styles.link}>
                    {t('auth.alreadyHaveAccount')}
                </Link>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
