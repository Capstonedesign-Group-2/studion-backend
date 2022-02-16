const redisApi = require('../api/redisRoom.js');

module.exports = {
    start: (io) => {
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
            await redisApi.test('test', 'test value');
            socket.on('join_room', data => {
                if (users[data.room]) {
                    const length = users[data.room].length;
                    if (length === maximum) {
                        socket.to(socket.id).emit('room_full');
                        return;
                    }

                    // disconnect가 안됬을때 같은 유저가 들어오는 것을 방지
                    let num = 0;
                    for (let i = 0; i < users[data.room].length; i++) {
                        if (users[data.room][i].id === socket.id) {
                            num++;
                            break;
                        }
                    }

                    if (num === 0) {
                        users[data.room].push({ id: socket.id, name: data.name, user_id: data.user_id });
                    }
                } else {
                    users[data.room] = [{ id: socket.id, name: data.name, user_id: data.user_id }];
                }
                socketToRoom[socket.id] = data.room;

                socket.join(data.room);
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} enter`);

                const usersInThisRoom = users[data.room].filter(user => user.id !== socket.id);

                console.log('usersInThisRoom', usersInThisRoom);

                io.sockets.to(socket.id).emit('all_users', usersInThisRoom);
            });

            // 합주실 리스트 업데이트 알림
            socket.on('update_room_list', () => {
                console.log('[ON] update_room_list');
                io.emit('update_room_list_on');
            });

            // 합주실 내부에 있는 유저들에게 정보 업데이트 알림
            socket.on('update_room_info', () => {
                const roomID = socketToRoom[socket.id];
                socket.to(roomID).emit('update_room_info_on');
            })

            // 유저가 합주실을 나갔을 때
            socket.on('exit_room', () => {
                console.log('[ON] exit room', socket.id);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    room = room.filter(user => user.id !== socket.id);
                    users[roomID] = room;
                    if (room.length === 0) {
                        delete users[roomID];
                        return;
                    }
                }
                socket.to(roomID).emit('user_exit', { id: socket.id });
            })

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
            })
            socket.on('disconnect', () => {
                console.log(`[${socketToRoom[socket.id]}]: ${socket.id} exit`);
                const roomID = socketToRoom[socket.id];
                let room = users[roomID];
                if (room) {
                    room = room.filter(user => user.id !== socket.id);
                    users[roomID] = room;
                    if (room.length === 0) {
                        delete users[roomID];
                        return;
                    }
                }
                socket.to(roomID).emit('user_exit', { id: socket.id });
                console.log('[disconnect]', users);
            })
        });


        chat.on('connection', socket => {
            console.log('chat connection ' + socket.id);

            socket.on('disconnect', () => {
                console.log('chat 연결해제')
            });
        })
    }
}