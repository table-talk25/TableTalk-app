// File: BACKEND/minimalServer.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// 1. Configurazione dell'App Express minimale
const app = express();
app.use(express.json());

// 2. Definizione del Modello User (direttamente qui)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('MinimalUser', UserSchema);

// 3. Rotta di Registrazione
app.post('/register', async (req, res) => {
    console.log('Ricevuta richiesta su /register del server minimale...');
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Dati mancanti' });
        }

        console.log('Tentativo di User.create...');
        const user = await User.create({ name, email, password });
        console.log('✅ User.create completato con successo!');
        
        res.status(201).json({ success: true, user });

    } catch (error) {
        console.error('❌ Errore nella rotta /register:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Avvio del Server e Connessione al DB
const startServer = async () => {
    if (!process.env.MONGO_URI) {
        return console.error('MONGO_URI non trovato nel file .env');
    }
    try {
        console.log('Tentativo di connessione a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connesso a MongoDB.');

        const PORT = 5002; // Usiamo una porta diversa per non andare in conflitto
        app.listen(PORT, () => {
            console.log(`🚀 Server minimale in ascolto sulla porta ${PORT}`);
            console.log(`Ora invia una richiesta POST a http://localhost:${PORT}/register`);
        });

    } catch (error) {
        console.error('🔥 Errore fatale durante l\'avvio:', error);
        process.exit(1);
    }
};

startServer();