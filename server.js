const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};
const MAX_DURATION = 40 * 60 * 1000; // 40 dakika

app.use(express.static('public')); // public klasörünü servis et

io.on('connection', socket => {
    socket.on('join-room', ({ roomId, username, password }) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: {},
                messages: [],
                password,
                startTime: Date.now()
            };
        }

        if (rooms[roomId].password !== password) {
            socket.emit('wrong-password');
            return;
        }

        rooms[roomId].users[socket.id] = username;

        // Sohbet geçmişini gönder
        socket.emit('chat-history', rooms[roomId].messages);

        // Kullanıcı listesi ve bağlantı
        socket.to(roomId).emit('user-connected', { userId: socket.id, username });
        io.to(roomId).emit('update-user-list', Object.values(rooms[roomId].users));

        // Mesaj al
        socket.on('message', message => {
            const msg = { username, message, timestamp: Date.now() };
            rooms[roomId].messages.push(msg);
            io.to(roomId).emit('createMessage', msg);
        });

        // Signal yönlendir
        socket.on('signal', data => {
            io.to(data.userId).emit('signal', {
                userId: socket.id,
                signal: data.signal,
                username
            });
        });

        // Bağlantı kesildi
        socket.on('disconnect', () => {
            if (rooms[roomId]) {
                delete rooms[roomId].users[socket.id];
                io.to(roomId).emit('user-disconnected', socket.id);
                io.to(roomId).emit('update-user-list', Object.values(rooms[roomId].users));

               /* if (Object.keys(rooms[roomId].users).length === 0) {
                    delete rooms[roomId];
                }*/
            }
        });
    });
});

// Oturum süresi ve süreyi client'a gönderme
setInterval(() => {
    const now = Date.now();
    for (let roomId in rooms) {
        const room = rooms[roomId];
        const elapsed = now - room.startTime;
        const remaining = Math.max(0, MAX_DURATION - elapsed);

        io.to(roomId).emit('update-timer', { remaining });

        if (remaining <= 0) {
            io.to(roomId).emit('session-ended');
            delete rooms[roomId];
        }
    }
}, 1000);

server.listen(3000, () => {
    console.log('Server 3000 portunda çalışıyor');
});
