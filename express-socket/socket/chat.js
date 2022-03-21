const firebaseApi = require('../api/Chat.js');

// clear
// 채팅창에 들어왔을 때 실시간 메시지보내면
// flag 0으로 설정하기
// 채팅방으로 들어와있다는 걸 알아야하니
// socket 내부에 객체하나 만들어서 저장할 것
// ---------------------------------------
// 그리고 내가 들어가 있는데 상대방이 읽었다면
// update 신호 보낼 event 만들 것
let init = async (io) => {
    let chat = io.of('/chat');
    chat['users'] = {};
    chat['socketToUsers'] = {};
    chat['inChat'] = {};

    chat.on('connection', socket => {
        console.log('chat connection');
        console.log(`chat정보 ${socket.id}`);

        socket.on('user_register', data => {
            //data set 
            // id: 1 -> user_id
            if (chat.users[data.id]) {
                delete chat.users[data.id];
                chat.users[data.id] = socket.id;
                chat.socketToUsers[socket.id] = data.id;
            } else {
                chat.users[data.id] = socket.id;
                chat.socketToUsers[socket.id] = data.id;
            }

            chat.to(socket.id).emit('user_register_on', {
                msg: '등록이 완료되었습니다.',
                id: chat.users[data.id]
            });

            console.log(`들어온 사람 ${chat.users[data.id]}`);
        });

        // 원하는 상대와 채팅 시작
        // clear
        // getChat 먼저 실행 후 없으면 할 것
        socket.on('enter_room', async (data) => {
            // data: [
            //     {   
            //         // 내정보
            //         // user_id
            //         // name
            //         // image
            //     },
            //     {
            //         // 상대정보
            //         // user_id
            //         // name
            //         // image
            //     }
            // ]
            try {
                let res = await firebaseApi.setChat(data);
                // 이미 있다면 res.flag 1 없으면 0
                // flag 값 1이면 바로 getMessage하세요
                chat.to(socket.id).emit('enter_room_on', res);
            } catch (e) {
                console.log(e)
            }
        });

        // 메시지 보내기
        // clear
        socket.on('send_msg', async (data) => {
            // data = {
            //     id: 3, // 상대 user_id
            //     room_id: 3, // 내 방 고유번호
            //     msg: { // 나의 정보
            //         user_id: 2,
            //         name: 'dong',
            //         image: null,
            //         content: 'test3 socket',
            //     }
            // }
            data.msg.timestamp = new Date().getTime();
            
            // 상대가 특정 채팅방에 들어와 있을 때
            if (chat.inChat[data.id] === room_id) {
                data.msg.flag = 0;
            } else {
                data.msg.flag = 1;
            }

            if (chat.users[data.id]) {
                socket.to(chat.users[data.id]).emit('send_msg_on', data.msg);
            }

            try {
                firebaseApi.setMessage(data.room_id, data.msg);
            } catch (e) {
                console.log(e)                
            }
        });

        // 채팅창 리스트 가져오기
        // clear
        socket.on("get_chats", async (data) => {
            // data: 2 -> 본인 user_id
            try {
                let res = await firebaseApi.getChats(data);

                chat.to(socket.id).emit("get_chats_on", res);
            } catch (e) {
                console.log(e);
            }
        });

        // 특정 채팅방 메시지 가져오기
        // clear
        socket.on("get_messages", async (data) => {
            // data: {
            //     room_id: 3, 
            //     user_id: 2, 상대의 user_id
            // }
            try {
                let res = await firebaseApi.getMessages(data.room_id, data.user_id);
                chat.to(socket.id).emit("get_messages_on", res);
            } catch (e) {
                console.log(e);
            }
        });

        // 특정 채팅방 유저 등록
        // 홈페이지를 들어갔거나 포커스가 되었을 때
        socket.on("register_in_chat", (data) => {
            // data : {
            //     room_id: 3,
            //     user_id: 2 본인 
            // }
            chat.inChat[data.user_id] = data.room_id;

            socket.emit("register_in_chat_on", {
                msg: "등록이 완료되었습니다."
            });
        });

        // 특정 채팅방 유저 해제
        // 홈페이지를 나갔거나 포커스가 벗어났을 때
        socket.on("delete_in_chat", () => {
            let user_id = chat.socketToUsers[socket.id];
 
            if (chat.inChat[user_id]) {
                delete chat.inChat[user_id];
            }

            socket.emit("delete_in_chat_on", {
                msg: "해제가 완료되었습니다."
            });
        });

        socket.on('exit', async (data) => {
            // data: {
            //     room_id: 3, // 나갈려는 방 아이디
            //     user_id: 3, // 내 아이디
            //     name: 'joon', // 내 아이디
            //     to: 2, // 상대방 아이디
            // }
            try {
                firebaseApi.exit(data.room_id, data.user_id);
                if (chat.users[data.to]) {
                    socket.to(chat.users[data.to]).emit('exit_on', {
                        msg: `${data.name}님이 나가셨습니다.`
                    });
                }
            } catch (e) {
                console.log(e)
            }
        });

        socket.on('disconnect', () => {
            let user_id = chat.socketToUsers[socket.id];

            if (chat.users[user_id]) {
                delete chat.users[user_id];
                delete chat.socketToUsers[socket.id];
            }

            if (chat.inChat[user_id]) {
                delete chat.inChat[user_id];
            }
            console.log('chat 연결해제')
        });
    });
}

module.exports = init;