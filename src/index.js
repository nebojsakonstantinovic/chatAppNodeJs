const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 4000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// let count = 0;

io.on('connection', (socket) => {
  console.log('New webSocket connection');

  // socket.emit('countUpdated', count);


  // Join
  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Wellcome!!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();

    // socket emit, io emit, socekt.broadcast.emit
    // io.to.emit, io.broadcast.to.emit
  });

  // Send message
  socket.on('sendMessage', (messageText, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();

    if (filter.isProfane(messageText)) {
      return callback('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, messageText));
    callback();
  });

  // socket.on('increment', () => {
  //   count++;
  //   // socket.emit('countUpdated', count);
  //   io.emit('countUpdated', count);
  // });

  socket.on('sendLocation', ({ lat, long }, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${long}`));
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server runing on port ${port}`);
});
