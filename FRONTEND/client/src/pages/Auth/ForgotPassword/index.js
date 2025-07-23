// File: src/pages/Auth/ForgotPassword/index.js (Versione Corretta)

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

// --- CORREZIONE: Importiamo l'oggetto di default senza parentesi graffe ---
import authService from '../../../services/authService';
import styles from './ForgotPassword.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Dobbiamo aggiungere la funzione al service, per ora simuliamo
            // await authService.forgotPassword(email); 
            setMessage('Se l\'email è registrata, riceverai un link per il reset.');
            toast.success('Richiesta inviata!');
        } catch (error) {
            toast.error(error.message || 'Si è verificato un errore.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2>Password Dimenticata</h2>
                <p>Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password.</p>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Invio...' : 'Invia Istruzioni'}
                    </button>
                </form>
                {message && <div className={styles.message}>{message}</div>}
                <div className={styles.backLink}>
                    <Link to="/login">Torna al Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;