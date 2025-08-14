// File: /pages/Auth/Login/index.js (Versione Corretta)

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { getPreference, savePreference, removePreference, PREFERENCE_KEYS } from '../../../utils/preferences';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Logo from '../../../components/common/Logo';
import styles from './LoginPage.module.css';
import BackButton from '../../../components/common/BackButton';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  // Precarica l'email salvata in passato, se presente
  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await getPreference(PREFERENCE_KEYS.LAST_LOGIN_EMAIL, '');
        if (savedEmail) {
          setFormData((prev) => ({ ...prev, email: savedEmail }));
          setRememberEmail(true);
        }
      } catch {}
    })();
  }, []);

  // Se già autenticato, vai direttamente ai pasti
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/meals', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    const from = location.state?.from?.pathname || '/meals';

    try {
      await login(formData); 
      // Salva o rimuove l'email in base al toggle
      try {
        if (rememberEmail) {
          await savePreference(PREFERENCE_KEYS.LAST_LOGIN_EMAIL, formData.email);
        } else {
          await removePreference(PREFERENCE_KEYS.LAST_LOGIN_EMAIL);
        }
      } catch {}
      requestAnimationFrame(() => navigate(from, { replace: true }));
    
    } catch (err) {
      console.error('Errore durante il login:', err);
      setError(err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
        <div style={{ padding: '12px 16px' }}>
            <BackButton />
        </div>
        <div className={styles.card}>
            <div className={styles.logoContainer}>
                <Link to="/" className={styles.logoLink}>
                    <Logo />
                </Link>
            </div>
            <h2 className={styles.title}>{t('auth.loginToTableTalk')}</h2>
            
            {location.state?.message && <Alert variant="success">{location.state.message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit} autoComplete="on">
                    <Form.Group className="mb-3">
                    <Form.Label className={styles.formLabel}>{t('auth.email')}</Form.Label>
                    <Form.Control
                        className={styles.formInput}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('auth.emailPlaceholder')}
                            autoComplete="username"
                            inputMode="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      id="remember-email"
                      label={t('auth.rememberEmail') || 'Ricorda email'}
                      checked={rememberEmail}
                      onChange={(e) => setRememberEmail(e.target.checked)}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label className={styles.formLabel}>{t('auth.password')}</Form.Label>
                    <InputGroup className={styles.inputGroup}>
                        <Form.Control
                            className={styles.formInput}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t('auth.passwordPlaceholder')}
                            autoComplete="current-password"
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
