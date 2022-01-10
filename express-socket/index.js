const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const socketIo = require('socket.io');
const io = socketIo.listen(server);

const PORT = process.env.PORT || 3000;

app.use(cors());

let users = {};
let socketToRoom = {};

const maximum = process.env.MAXIMUM || 4;

io.on('connection', socket => {
    socket.on('join_room', data => {
        if (users[data.room]) {
            const length = users[data.room].length;

            if (length === maximum) {
                socket.to(socket.id).emit('room_full');
                return;
            }

            users[data.room].push({id: socket.id, email: data.email});
        } else {
            users[data.room] = [{id: socket.id, email: data.email}];
        }
        
        socketToRoom[socket.id] = data.room;
        
        socket.join(data.room);

        const usersInThisRoom = users[data.room].filter(user => user.id !== socket.id);

        console.log(usersInThisRoom);

        io.sockets.to(socket.id).emit('all_users', usersInThisRoom);
    })
});

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});