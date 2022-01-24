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

            users[roomID].push({id: socket.id, name: data.name, user_id: data.data.user_id});
            
            socketToRoom[socket.id] = roomID;
            socket.join(roomID);
            
            // 사용자가 페이지 새로고침시 users 변수에 값이 누적되지 않게 동일한 사용자의 socket.id 값을 삭제한다.
            for(let num in users) {

                // 사용자 이름이 같으면서, 기존소켓아이디와 현재 소켓아이디가 다른 값이 있는지 찾아낸다.
                if(users[num]['user_id'] == data.data.user_id && users[num]['id'] != socket.id) {
                    // users의 해당 순서의 값을 삭제한다.
                    users.splice(num, 1);
                }
            }

            const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);
    
            socket.to(roomID).emit('all_users', usersInThisRoom);
        }

        func();

        // 실시간으로 방 목록 갱신
        func = async() => {
            res = await obj.roomList();

            io.emit('show_on', res);
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
                users[roomID] = [{id: socket.id, name: data.name, user_id: data.data.creater}];
                console.log(users);
                console.log(users[roomID].length);
            } else {
                socket.to(socket.id).emit('error');
                return;
            }

            socketToRoom[socket.id] = roomID;
        
            socket.join(roomID);

            io.sockets.to(socket.id).emit('create_room_on', res);
        }
        
        func();

        // 실시간으로 방 목록 갱신
        func = async() => {
            res = await obj.roomList();

            io.emit('show_on', res);
        }
        
        func();
    })

    socket.on('update', data => {
        // data set
        // token: token
        // roomId: room_id
        // data: 방 수정할 때 data set
        func = async() => {
            res = await obj.updateRoom(data.token, data.roomId, data.data);
            
            if (res.status === 'success') {
                socket.to(data.roomId).emit('update_on', res);
            } else {
                socket.to(socket.id).emit('error');
                return;
            }
        }

        func();

        // 실시간으로 방 목록 갱신
        func = async() => {
            res = await obj.roomList();

            io.emit('show_on', res);
        }
        
        func();
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
    socket.on('exit_room', data => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];

        // data set
        // token: token
        // roomId: roomId
        // userId: userId
        func = async() => {
            res = await obj.exitRoom(data.token, data.roomId, data.userId);

            if (res.status === 'success') {
                room = room.filter(user => user.id != socket.id);
                users[roomID] = room; 
                socket.leave(roomID);
            } else {
                socket.to(socket.id).emit('error');
                return;
            }

            // 방 폭파
            if (room.length === 0) {
                // data set
                // token: token
                // roomId: roomId
                // userId: userId
                res = await obj.destoryRoom(data.token, data.roomId, data.userId);
                
                if (res.status === 'success') {
                    delete users[roomID];
                    return;
                } else {
                    socket.to(socket.id).emit('error');
                    return;
                }
            }  

            socket.to(roomID).emit('user_exit', {id: socket.id});
        } 

        func();

        // 실시간으로 방 목록 갱신
        func = async() => {
            res = await obj.roomList();

            io.emit('show_on', res);
        }
        
        func();
    });

    socket.on('disconnect', () => {
        console.log('연결해제')
    });
});

server.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});