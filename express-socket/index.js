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

// const obj = require('./api/Room.js');

app.use(cors());

const PORT = process.env.PORT || 5000;


let users = {};
let socketToRoom = {};
let roomID;
// let res;
// let func;

const maximum = process.env.MAXIMUM || 4;

const room = io.of('/room');
const chat = io.of('/chat');

// room socket 연결
room.on('connection', socket => {
    console.log('room connection ' + socket.id);

    // 방 입장
    socket.on('join_room', data => {
        // data set 
        // name: user_name,
        // room: room_id 
        
        roomID = data.room;
        if (users[roomID]) {
            const length = users[roomID].length;
            
            if (length === maximum) {
                socket.to(socket.id).emit('room_full');
                return;
            }

            users[roomID].push({id: socket.id, name: data.name, user_id: data.user_id});
        } else {
            users[roomID] = [{id: socket.id, name: data.name, user_id: data.user_id}]
        }

        // 사용자가 페이지 새로고침시 users 변수에 값이 누적되지 않게 동일한 사용자의 socket.id 값을 삭제한다.
        for(let i = 0; i < users[roomID].length; i++) {
            // 사용자 고유번호가 같으면서, 기존소켓아이디와 현재 소켓아이디가 다른 값이 있는지 찾아낸다.
            if(users[roomID][i].user_id == data.user_id && users[roomID][i].id != socket.id) {
                // users의 해당 순서의 값을 삭제한다.
                users[roomID].splice(i, 1);
            }
        }

        socketToRoom[socket.id] = roomID;

        socket.join(roomID);
        console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`)

        const usersInThisRoom = users[data.room].filter(user => user.id !== socket.id);;
        console.log(usersInThisRoom);
        
        io.in(roomID).emit('all_users', usersInThisRoom);
    });
    
    socket.on('update_room_list', () => {
        io.emit('update_room_list_on', {
            msg: 'updated room list'
        });
    });

    socket.on('update_room_setting', data => {
        socket.to(data.room).emit('update_room_setting_on', {
            msg: 'updated room setting'
        });
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
    
        room = room.filter(user => user.id != socket.id);
        users[roomID] = room; 
        socket.leave(roomID);

        // 방 폭파
        if (room.length === 0) {
            delete users[roomID];
            return;
        }  

        socket.to(roomID).emit('user_exit', {id: socket.id});
    });

    socket.on('disconnect', () => {
        console.log('room 연결해제')
    });
});


chat.on('connection', socket => {
    console.log('chat connection ' + socket.id);
    
    socket.on('disconnect', () => {
        console.log('chat 연결해제')
    });
})

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});