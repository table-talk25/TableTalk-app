// File: BACKEND/test-server.js

const http = require('http');
const { Server } = require('socket.io');

// Creiamo un server HTTP di base
const server = http.createServer();

// Inizializziamo Socket.IO con una configurazione CORS super permissiva (solo per il test)
const io = new Server(server, {
  cors: {
    origin: "*", // Accetta connessioni da qualsiasi origine
    methods: ["GET", "POST"]
  }
});

// Quando un client si connette...
io.on('connection', (socket) => {
  console.log('✅ Un client di test si è connesso!');
  // ...gli inviamo un messaggio di benvenuto.
  socket.emit('test-event', 'Ciao dal server di test!');
});

// Mettiamo il server in ascolto su una porta diversa (5002) per non andare in conflitto
server.listen(5002, () => {
  console.log('🚀 Server di test in ascolto sulla porta 5002');
});