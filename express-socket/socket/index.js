// const redisApi = require('../api/redisRoom.js');
const chat = require('./chat.js');
const cloneDeep = require("lodash.clonedeep");

module.exports = {
    start: async (io) => {
        let users = {};
        let socketToRoom = {};
        
        let roomInfo = {
            rooms: []
        };

        let userToRoom = {};
        let roomCount = 1;
        
        let getList = () => {
            if (roomInfo.rooms.length === 0) return roomInfo;

            for (let i = 0; i < roomInfo.rooms.length; i++) {
                if (userToRoom[roomInfo.rooms[i].id] && userToRoom[roomInfo.rooms[i].id].length !== 0) {
                    roomInfo.rooms[i].users = userToRoom[roomInfo.rooms[i].id];
                } else {
                    roomInfo.rooms.splice(i, 1);
                    i--;
                }
            }

            return roomInfo;
        }
        let getInfo = (id, flag, data) => {
            for (let i = 0; i < roomInfo.rooms.length; i++) {
                if (roomInfo.rooms[i].id == id) {
                    if (flag) roomInfo.rooms[i] = data;
                    roomInfo.rooms[i].users = userToRoom[id];
                    
                    return roomInfo.rooms[i];
                }
            }
        }

        const maximum = process.env.MAXIMUM || 5;

        
        // room socket 연결
        io.on('connection', async (socket) => {
            chat(io, socket);
            // room list 가져올 시 room 내부 사람들 정보도 가져옴
            // clear
            socket.on('get_room_list', async () => {
                let res = getList();
                io.to(socket.id).emit('get_room_list_on', res);
            });

            // 방 내부 사람들 
            // clear
            socket.on('get_room_user', async (data) => {
                // data = {
                //    room_id: 1
                // }
                let res = userToRoom[data.room_id];
                io.to(socket.id).emit('get_room_user_on', res);
            });

            // clear
            socket.on('create_room', async (data) => {
                // hash: studion, key: data.room.id, value: data 
                    // data = {
                    //     creater: 'joon' -> user_name
                    //     title: 'good' 
                    //     content: 'set room content'
                    //     max: 4
                    //     locked: 0
                    //     // locked: 1이면 password 까지
                    // }
                data['id'] = roomCount;
                roomCount++;
                roomInfo['rooms'].push(data);
                
                console.log(roomInfo);
                io.to(socket.id).emit('create_room_on', data);
            });

            // clear
            socket.on('update_room_info', async (data) => {
                // hash: studion, key: data.room.id, value: data 
                    // data = {
                    //     id: 1
                    //     creater: 'joon' -> user_name
                    //     title: 'good' 
                    //     content: 'set room content'
                    //     max: 4
                    //     locked: 0
                    //     // locked: 1이면 password 까지
                    // }
                
                let res = getInfo(data.id, true, data);
                io.to(data.id).emit('update_room_info_on', res);
                res = getList();
                socket.broadcast.emit('update_room_list_on', res);
            });

            // clear
            socket.on('join_room', async (data) => {
                // data = {
                //     user: {
                //         id: 1,
                //         name: 'joon',
                //         email: 'joon@naver.com',
                //         image: null,
                //     },
                //     room_id: 'room1'
                // };

                if (users[data.room_id]) {
                    const length = users[data.room_id].length;
                    if (length === maximum) {
                        io.to(socket.id).emit('room_full');
                        return;
                    }

                    // disconnect가 안됬을때 같은 유저가 들어오는 것을 방지
                    let num = 0;
                    for (let i = 0; i < users[data.room_id].length; i++) {
                        if (users[data.room_id][i].id === socket.id) {
                            num++;
                            break;
                        }
                    }

                    if (num === 0) {
                        users[data.room_id].push({ id: socket.id, name: data.user.name, user_id: data.user.id });
                    }
                } else {
                    users[data.room_id] = [{ id: socket.id, name: data.user.name, user_id: data.user.id }];
                }
                socketToRoom[socket.id] = data.room_id;
                data.user['socket_id'] = socket.id;

                if (userToRoom[data.room_id]) {
                    let roomUser = userToRoom[data.room_id];
                    roomUser = roomUser.filter(user => user.id !== data.user.id);
                    userToRoom[data.room_id] = roomUser;
                    userToRoom[data.room_id].push(data.user);
                } else {
                    userToRoom[data.room_id] = [data.user];
                }

                socket.join(data.room_id);
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`);
                console.log(userToRoom);
                const usersInThisRoom = users[data.room_id].filter(user => user.id !== socket.id);
                
                console.log('usersInThisRoom', usersInThisRoom);
                
                io.sockets.to(socket.id).emit('all_users', usersInThisRoom);
                
                let res = getList();
                io.emit('update_room_list_on', res);
            });

            // 합주실 리스트 업데이트 알림
            // clear
            socket.on('update_room_list', async () => {
                console.log('[ON] update_room_list');

                let res = getList();
                io.emit('update_room_list_on', res);
            });

            // 합주실 내부에 있는 유저들에게 정보 업데이트 알림
            // clear
            socket.on('get_room_info', async (data) => {
                let res = getInfo(data.id, false);
                io.to(data.id).emit('update_room_info_on', res);
            });

            // 시작 시 합주실 리스트 가져오기
            // clear
            socket.on('get_rooms', async () => {
                let res = getList();
                io.to(socket.id).emit('get_rooms_on', res);
            });

            // 유저가 합주실을 나갔을 때
            // clear
            socket.on('exit_room', async () => {
                console.log('[ON] exit room', socket.id);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    let roomUser = userToRoom[roomID]
                    roomUser = roomUser.filter(user => user.socket_id !== socket.id);
                    userToRoom[roomID] = roomUser;

                    room = room.filter(user => user.id !== socket.id);
                    users[roomID] = room;
                    socket.leave(roomID);
                }
                socket.to(roomID).emit('user_exit', { id: socket.id });
                let res = getList();
                socket.broadcast.emit('update_room_list_on', res);
                res = getInfo(roomID, false);
                socket.to(roomID).emit('update_room_info_on', res);
            })

            socket.on('send_msg', data => {
                // data = {
                //     name: 'joon',
                //     image: null,
                //     msg: 'hello'
                // }
                const roomID = socketToRoom[socket.id];
                socket.to(roomID).emit('send_msg_on', data);
            });

            socket.on('offer', data => {
                socket.to(data.offerReceiveID).emit('getOffer', {
                    sdp: data.sdp,
                    offerSendID: data.offerSendID,
                    offerSendName: data.offerSendName,
                });
            });

            socket.on('answer', data => {
                socket.to(data.answerReceiveID).emit('getAnswer', { sdp: data.sdp, answerSendID: data.answerSendID });
            });

            socket.on('candidate', data => {
                socket.to(data.candidateReceiveID).emit('getCandidate', { candidate: data.candidate, candidateSendID: data.candidateSendID });
            });

            // clear
            socket.on('disconnect', async () => {
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    let roomUser = userToRoom[roomID]
                    roomUser = roomUser.filter(user => user.socket_id !== socket.id);
                    userToRoom[roomID] = roomUser;

                    room = room.filter(user => user.id !== socket.id);
                    users[roomID] = room;
                    socket.leave(roomID);
                    socket.to(roomID).emit('user_exit', { id: socket.id });
                    let rooms = getList();
                    socket.broadcast.emit('update_room_list_on', rooms);
                    let res = getInfo(roomID, false);
                    socket.to(roomID).emit('update_room_info_on', res);
                }
                console.log('[disconnect]', users);
            });
        });
    }
}