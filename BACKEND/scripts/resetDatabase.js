// Script per resettare completamente il database MongoDB Atlas
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const resetDatabase = async () => {
  console.log('🔄 Inizio reset del database...');
  
  try {
    // Connessione al database
    console.log('📡 Connessione a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connesso a MongoDB Atlas');
    
    // Ottieni il database
    const db = mongoose.connection.db;
    console.log(`🗄️ Database: ${db.databaseName}`);
    
    // Lista tutte le collezioni
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collezioni trovate: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('🗑️ Eliminazione di tutte le collezioni...');
      
      for (const collection of collections) {
        console.log(`   - Eliminando: ${collection.name}`);
        await db.dropCollection(collection.name);
      }
      
      console.log('✅ Tutte le collezioni eliminate');
    } else {
      console.log('ℹ️ Nessuna collezione da eliminare');
    }
    
    // Ricreiamo le collezioni con gli indici necessari
    console.log('🔨 Ricreazione delle collezioni...');
    
    // Collezione Users
    await db.createCollection('users');
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ 'location.coordinates': '2dsphere' });
    console.log('✅ Collezione "users" ricreata con indici');
    
    // Collezione Meals
    await db.createCollection('meals');
    const mealsCollection = db.collection('meals');
    await mealsCollection.createIndex({ 'location.coordinates': '2dsphere' });
    await mealsCollection.createIndex({ date: 1 });
    await mealsCollection.createIndex({ status: 1 });
    console.log('✅ Collezione "meals" ricreata con indici');
    
    // Collezione Chats
    await db.createCollection('chats');
    const chatsCollection = db.collection('chats');
    await chatsCollection.createIndex({ mealId: 1 });
    await chatsCollection.createIndex({ participants: 1 });
    console.log('✅ Collezione "chats" ricreata con indici');
    
    // Collezione Notifications (se esiste)
    await db.createCollection('notifications');
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.createIndex({ userId: 1 });
    await notificationsCollection.createIndex({ createdAt: 1 });
    console.log('✅ Collezione "notifications" ricreata con indici');
    
    console.log('🎉 Reset del database completato con successo!');
    console.log('📊 Database ora vuoto e pronto per l\'uso');
    
  } catch (error) {
    console.error('❌ Errore durante il reset del database:', error.message);
  } finally {
    // Chiudi la connessione
    await mongoose.connection.close();
    console.log('🔌 Connessione al database chiusa');
    process.exit(0);
  }
};

// Esegui lo script
resetDatabase(); 