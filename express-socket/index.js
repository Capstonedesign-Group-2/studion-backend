const express = require('express');
const http = require('http');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

const obj = require('./api/Room.js');

app.use(cors());

const PORT = process.env.PORT || 5000;


let users = {};
let socketToRoom = {};
let roomID;
let res;
let func;

const maximum = process.env.MAXIMUM || 4;

app.set('io', io);
const room = io.of('/room');
const chat = io.of('/chat');

// room socket 연결
io.on('connection', socket => {

    socket.on('show', () => {
        // promise가 반환되기때문에
        // 동기처리를 해줘야 데이터가
        // 제대로 넘어온다.
        // 하루걸림
        func = async() => {
            res = await obj.roomList();

            io.emit('show_on', res);
        }

        func();
    });

    console.log('room connection');
    // 방 입장
    socket.on('join_room', data => {
        // data set 
        // token: 토큰, data: room만들때 데이터, name: user_name,
        // room: room_id -> 방이 있을 시에만,
        // flag: 1 or 0 -> 1이면 방 입장, 0이면 방 만들고 입장
        // 만들어진 방 입장 시
        let res;
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
            res = obj.createRoom(data.token, data.data);
            console.log(res.data);

            if (res.data.status === 'success') {
                roomID = res.data.room.id;  
                users[roomID] = [{id: socket.id, name: data.name}];
            } else {
                socket.to(socket.id).emit('error');
                return;
            }
        }
        console.log('join_room 3')
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
    socket.on('exit_room', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];

        res = obj.exitRoom(data.token, data.roomId);

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

    socket.on('disconnect', () => {
        console.log('연결해제')
    });
});

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});