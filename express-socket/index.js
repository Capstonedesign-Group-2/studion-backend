const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const io = require('socket.io')(server);

// import { createRoom } from './api/Room';
const { createRoom, exitRoom } = require('./api/Room.js');

const PORT = process.env.PORT || 3000;

app.use(cors());

let users = {};
let socketToRoom = {};
let res;
let roomID;

const maximum = process.env.MAXIMUM || 4;
const room = io.of('/room');
const chat = io.of('/chat');

// socket 연결
room.on('connection', socket => {
    // 방 입장
    socket.on('join_room', data => {
        // data set 
        // token: 토큰, data: room만들때 데이터, name: user_name,
        // room: room_id -> 방이 있을 시에만,
        // flag: 1 or 0 -> 1이면 방 입장, 0이면 방 만들고 입장
        
        // 만들어진 방 입장 시
        if (data.flag) {
            roomID = data.room;
            const length = users[roomID].length;

            if (length === maximum) {
                socket.to(socket.id).emit('room_full');
                return;
            }

            users[roomID].push({id: socket.id, name: data.name});
        } else {
            // 방 만들고 입장 시
            res = createRoom(data.token, data.data);

            if (res.data.status === 'success') {
                roomID = res.data.room.id;  
                users[roomID] = [{id: socket.id, name: data.name}];
            } else {
                socket.to(socket.id).emit('error');
                return;
            }
        }
        
        socketToRoom[socket.id] = roomID;
        
        socket.join(roomID);

        const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);

        console.log(usersInThisRoom);

        io.sockets.to(socket.id).emit('all_users', res.data);
    });

    // webRTC 시그널링
    socket.on('offer', data => {
        socket.to(data.offerReceiveID).emit('getOffer', {
            sdp: data.sdp,
            offerSendID: data.offerSendID,
            offerSendEmail: data.offerSendEmail
        });
    });

    socket.on('answer', data => {
        socket.to(data.answerReceiveID).emit('getAnswer', {
            sdp: data.sdp, 
            answerSendID: data.answerSendID
        });
    });

    socket.on('candidate', data => {
        socket.to(data.candidateReceiveID).emit('getCandidate', {
            candidate: data.candidate, 
            candidateSendID: data.candidateSendID
        });
    });

    // 방 퇴장
    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];

        res = exitRoom(data.token, data.roomId);

        if (res.data.status !== 'success') {
            return;
        }

        if (room) {
            room = room.filter(user => user.id != socket.id);
            users[roomID] = room; 
            socket.leave(roomID);
            if (room.length === 0) {
                delete users[roomID];
                return;
            }  
        }

        socket.to(roomID).emit('user_exit', {id: socket.id});
    });
});

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});