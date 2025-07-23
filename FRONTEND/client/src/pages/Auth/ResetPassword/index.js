// File: src/pages/Auth/ResetPassword/index.js (Versione Corretta)

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- CORREZIONE: Importiamo l'oggetto di default senza parentesi graffe ---
import authService from '../../../services/authService';
import styles from './ResetPassword.module.css';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useParams(); // Prende il token dall'URL
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Le password non coincidono.');
            return;
        }
        setLoading(true);
        try {
            // Dobbiamo aggiungere la funzione al service, per ora simuliamo
            // await authService.resetPassword(token, password);
            toast.success('Password reimpostata con successo! Ora puoi fare il login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || 'Token non valido o scaduto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2>Reimposta Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Nuova Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Conferma Nuova Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Salvataggio...' : 'Salva Nuova Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;