// File: BACKEND/test-connection.js
// Esegui questo file per testare la connessione Atlas

const mongoose = require('mongoose');
const path = require('path');
// Carica il .env dalla cartella principale (un livello sopra)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const testConnection = async () => {
  console.log('🔍 Testing MongoDB Atlas connection...');
  console.log('📍 URI utilizzata:', process.env.MONGO_URI?.replace(/:[^:]*@/, ':***@'));
  
  try {
    // Test di connessione più dettagliato
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 secondi
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connessione riuscita!');
    console.log('📊 Database:', conn.connection.name);
    console.log('🖥️  Host:', conn.connection.host);
    console.log('🔌 Stato:', conn.connection.readyState);
    
    // Test di scrittura
    const testDoc = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('ConnectionTest', testDoc);
    
    const doc = new TestModel({ test: 'Atlas connection works!' });
    await doc.save();
    console.log('✅ Test di scrittura riuscito!');
    
    // Pulizia
    await TestModel.deleteMany({});
    await mongoose.connection.close();
    console.log('🧹 Pulizia completata');
    
  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);
    
    // Diagnosi dettagliata
    if (error.message.includes('Authentication failed')) {
      console.log('🔐 PROBLEMA: Credenziali non valide');
      console.log('   - Verifica username/password in Atlas');
      console.log('   - Controlla che l\'utente abbia i permessi giusti');
    } else if (error.message.includes('IP not whitelisted')) {
      console.log('🚫 PROBLEMA: IP non autorizzato');
      console.log('   - Aggiungi il tuo IP alla whitelist di Atlas');
      console.log('   - Oppure usa 0.0.0.0/0 per permettere tutti gli IP');
    } else if (error.message.includes('Server selection timed out')) {
      console.log('⏱️  PROBLEMA: Timeout di connessione');
      console.log('   - Controlla la tua connessione internet');
      console.log('   - Verifica che il cluster sia attivo');
    }
    
    process.exit(1);
  }
};

testConnection();