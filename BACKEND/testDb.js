// File: BACKEND/testDb.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' }); // Carica il .env dalla cartella principale

// Definiamo un modello User semplificato, solo per il test
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Aggiungiamo lo stesso hook di hashing che hai tu
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('TestUser', UserSchema);


const runTest = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ La variabile MONGO_URI non è stata trovata. Assicurati che il file .env sia corretto.');
    return;
  }

  console.log('--- INIZIO TEST DI SCRITTURA SU DB ---');
  console.log('Tentativo di connessione...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connessione al database riuscita.');

    console.log('\nTentativo di creare un nuovo utente...');
    const user = await User.create({
      name: 'Test',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    });

    console.log('✅ Utente creato con successo!');
    console.log(user);

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TEST:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n--- FINE TEST ---');
    console.log('Connessione al database chiusa.');
  }
};

runTest();