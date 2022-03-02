const redisApi = require('../api/redisRoom.js');

module.exports = {
    // join, create event 나눔
    // 룸 정보는 socket이랑 redis 삭제안함 리스트보여줄때 length 0 빼기
    start: async (io) => {
        let users = {};
        let socketToRoom = {};
        
        // let roomID;
        // let res;
        // let func;

        const maximum = process.env.MAXIMUM || 4;

        const room = io.of('/room');
        const chat = io.of('/chat');

        // room socket 연결
        io.on('connection', async (socket) => {
            // room list 가져올 시 room 내부 사람들 정보도 가져옴
            socket.on('get_room_list', async () => {
                let res = await redisApi.getRoomList();
                console.log(res);
                io.to(socket.id).emit('get_room_list_on', res);
            });

            // 방 내부 사람들 
            socket.on('get_room_user', async (data) => {
                // data = {
                //    room_id: room1
                // }
                let res = await redisApi.getRoomUser(data.room_id);
                console.log(res);
                io.to(socket.id).emit('get_room_user_on', res);
            });

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
                let roomCount = await redisApi.getRoomCount();
                data['id'] = roomCount;
                    
                await redisApi.createRoom(data.id, data);
                
                io.to(socket.id).emit('create_room_on', data);
            });

            socket.on('setting_room', async (data) => {
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
                
                await redisApi.createRoom(data.id, data);
                let res = await redisApi.getRoomInfo(data.id);
                io.to(data.id).emit('update_room_info_on', res);
            });

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
                // hash: room_id, key: socket_id, value: user_data 
                await redisApi.joinRoom(data.room_id, socket.id, data.user);
                socket.join(data.room_id);
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`);

                const usersInThisRoom = users[data.room_id].filter(user => user.id !== socket.id);

                console.log('usersInThisRoom', usersInThisRoom);

                io.sockets.to(socket.id).emit('all_users', usersInThisRoom);

                let res = await redisApi.getRoomList();
                io.emit('update_room_list_on', res);
            });

            // 합주실 리스트 업데이트 알림
            socket.on('update_room_list', async () => {
                console.log('[ON] update_room_list');
                let res = await redisApi.getRoomList();
                io.emit('update_room_list_on', res);
            });

            // 합주실 내부에 있는 유저들에게 정보 업데이트 알림
            socket.on('update_room_info', async (data) => {
                let res = await redisApi.getRoomInfo(data.id);
                io.to(data.id).emit('update_room_info_on', res);
                res = await redisApi.getRoomList();
                io.emit('update_room_list_on', res);
            })

            // 유저가 합주실을 나갔을 때
            socket.on('exit_room', async () => {
                console.log('[ON] exit room', socket.id);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    let res = await redisApi.exitRoom(roomID, socket.id);
                    if (res) {
                        room = room.filter(user => user.id !== socket.id);
                        users[roomID] = room;
                        socket.leave(roomID);
                    }
                    // if (room.length === 0) {
                    //     let res = await redisApi.destoryRoom(roomID);
                    //     if (res) {
                    //         delete users[roomID];
                    //         socket.leave(roomID);
                    //         return;
                    //     }
                    // }
                }
                socket.to(roomID).emit('user_exit', { id: socket.id });
                let res = await redisApi.getRoomList();
                io.emit('update_room_list_on', res);
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
                //console.log(data.sdp);
                socket.to(data.offerReceiveID).emit('getOffer', {
                    sdp: data.sdp,
                    offerSendID: data.offerSendID,
                    offerSendName: data.offerSendName,
                });
            });

            socket.on('answer', data => {
                //console.log(data.sdp);
                socket.to(data.answerReceiveID).emit('getAnswer', { sdp: data.sdp, answerSendID: data.answerSendID });
            });

            socket.on('candidate', data => {
                //console.log(data.candidate);
                socket.to(data.candidateReceiveID).emit('getCandidate', { candidate: data.candidate, candidateSendID: data.candidateSendID });
            });

            socket.on('disconnect', async () => {
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    let res = await redisApi.exitRoom(roomID, socket.id);
                    if (res) {
                        room = room.filter(user => user.id !== socket.id);
                        users[roomID] = room;
                        socket.leave(roomID);
                    }
                    // if (room.length === 0) {
                    //     let res = await redisApi.destoryRoom(roomID);
                    //     if (res) {
                    //         delete users[roomID];
                    //         socket.leave(roomID);
                    //         return;
                    //     }
                    // }
                    socket.to(roomID).emit('user_exit', { id: socket.id });
                    let rooms = await redisApi.getRoomList();
                    io.emit('update_room_list_on', rooms);
                }
                console.log('[disconnect]', users);
            });
        });


        chat.on('connection', socket => {
            console.log('chat connection ' + socket.id);
        
            socket.on('disconnect', () => {
                console.log('chat 연결해제')
            });
        });
    }
}