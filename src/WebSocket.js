// Serveur WebSocket
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  // Gérer la pause/play
  socket.on('togglePlayback', (isPlaying) => {
    console.log(`togglePlayback received from ${socket.id}: ${isPlaying}`);
    io.emit('togglePlayback', isPlaying);
  });

  socket.on("updateCurrentTrackInfo", (trackInfo) => {
    console.log(`updateCurrentTrackInfo ${trackInfo}`);
    io.emit("currentTrackInfoUpdated", trackInfo);
  });

  // Gérer la déconnexion
  socket.on('disconnect', () => {
    console.log('Déconnexion:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur WebSocket écoutant sur le port ${PORT}`);
});