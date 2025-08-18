// Script per creare un utente di test
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connessione al database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

async function createTestUser() {
  try {
    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email: 'test@tabletalk.com' });
    
    if (existingUser) {
      console.log('✅ Utente di test già esistente:', existingUser.email);
      return;
    }

    // Crea l'utente di test
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    const testUser = new User({
      name: 'Test',
      surname: 'User',
      email: 'test@tabletalk.com',
      password: hashedPassword,
      dateOfBirth: new Date('1990-01-01'),
      isEmailVerified: true, // Per permettere il login immediato
      profileCompleted: false
    });

    await testUser.save();
    console.log('✅ Utente di test creato con successo!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password: Password123!');
    
  } catch (error) {
    console.error('❌ Errore nella creazione utente di test:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
