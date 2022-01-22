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

    console.log('room connection ' + socket.id);
    // 방 입장
    socket.on('join_room', data => {
        // data set 
        // token: 토큰, 
        // name: user_name,
        // data: 들어갈 때 필요한 데이터
        // room: room_id 
        
        roomID = data.room;
        const length = users[roomID].length;

        if (length === maximum) {
            socket.to(socket.id).emit('room_full');
            return;
        }

        func = async() => {
            res = await obj.enterRoom(data.token, roomID, data.data) 

            if (res.status !== 'success') {
                socket.to(socket.id).emit('error');
                return;
            }

            users[roomID].push({id: socket.id, name: data.name});
            
            socketToRoom[socket.id] = roomID;
            
            socket.join(roomID);
    
            const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);
    
            console.log(usersInThisRoom);
        
            socket.to(roomID).emit('all_users', res);
        }

        func();
    });
    // 방 만들기
    socket.on('create_room', data => {
        // data set 
        // token: 토큰, 
        // data: room만들때 데이터, 
        // name: user_name,
        func = async() => {
            res = await obj.createRoom(data.token, data.data);

            console.log(res);
            
            if (res.status === 'success') {
                roomID = res.room.id;
                users[roomID] = [{id: socket.id, name: data.name}];
            } else {
                socket.to(socket.id).emit('error');
                return;
            }

            socketToRoom[socket.id] = roomID;
        
            socket.join(roomID);
            console.log(roomID);
            const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);

            console.log(usersInThisRoom);
    
            io.sockets.to(socket.id).emit('all_users', res);
        }
        
        func();
    })

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