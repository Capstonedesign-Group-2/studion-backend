const firebaseApi = require('../api/Chat.js');

let chat_users = {};
let socketToUsers = {};
let inChat = {};

let init = async (io, socket) => {
    // let chat = io.of('/chat');
    // let chat_users = {};
    // let socketToUsers = {};
    // let inChat = {};
    socket.on('user_register', data => {
        // data set 
        // id: 1 -> user_id
        if (chat_users[data.id]) {
            delete chat_users[data.id];
            chat_users[data.id] = socket.id;
            socketToUsers[socket.id] = data.id;
        } else {
            chat_users[data.id] = socket.id;
            socketToUsers[socket.id] = data.id;
        }

        io.to(socket.id).emit('user_register_on', {
            msg: '등록이 완료되었습니다.',
            id: chat_users
        });

        console.log(`들어온 사람 ${chat_users[data.id]}`);
    });
    
    // 원하는 상대와 채팅 시작
    // clear
    socket.on('create_chat', async (data) => {
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

            if (!res.flag) {
                let msg = {
                    user_id: 0,
                    name: 'admin',
                    image: null,
                    content: '대화를 시작하였습니다.',
                    timestamp: new Date().getTime(),
                    notice: 1,
                    flag: 0
                }
                
                await firebaseApi.setMessage(res.id, msg);
            }

            // 이미 있다면 res.flag 1 없으면 0
            // 받으면 getmessage 할 것
            io.to(socket.id).emit('create_chat_on', res);
        } catch (e) {
            console.log(e)
        }
    });

    // 메시지 보내기
    // clear
    socket.on('send_chat_msg', async (data) => {
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
        data.msg.notice = 0;

        // 상대가 특정 채팅방에 들어와 있을 때
        if (inChat[data.id] === data.room_id) {
            data.msg.flag = 0;
        } else {
            data.msg.flag = 1;
        }

        if (chat_users[data.id]) {
            socket.to(chat_users[data.id]).emit('send_chat_msg_on', data.msg);

            let res = await firebaseApi.getChats(data.id);

            socket.to(chat_users[data.id]).emit('update_chats', res);
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

            io.to(socket.id).emit("get_chats_on", res);
        } catch (e) {
            console.log(e);
        }
    });

    // 특정 채팅방 정보 가져오기
    socket.on("get_chat_data", async (data) => {
        // data: {
        //      room_id: 2,
        //      user_id: 1 -> 본인 user_id
        //}
        try {
            let res = await firebaseApi.getChatData(data);
            console.log(res);
            io.to(socket.id).emit("get_chat_data_on", res);
        } catch (e) {
            console.log(e);
        }
    })

    // 특정 채팅방 메시지 가져오기
    // clear
    socket.on("get_messages", async (data) => {
        // data: {
        //     room_id: 3, 
        //     user_id: 2, 상대의 user_id
        // }
        try {
            let res = await firebaseApi.getMessages(data.room_id, data.user_id);
            io.to(socket.id).emit("get_messages_on", res);
            // 상대가 채팅방에 들어가 있을 때 내가 읽어서
            // flag 0으로 변환시 update로 알려주고 정보 다시 보내줌
            if (inChat[data.user_id]) {
                socket.to(data.user_id).emit("update_flag_message", res);
            }
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
        inChat[data.user_id] = data.room_id;

        socket.emit("register_in_chat_on", {
            msg: "등록이 완료되었습니다."
        });
    });

    // 특정 채팅방 유저 해제
    // 홈페이지를 나갔거나 포커스가 벗어났을 때
    socket.on("delete_in_chat", () => {
        let user_id = socketToUsers[socket.id];

        if (inChat[user_id]) {
            delete inChat[user_id];
        }

        socket.emit("delete_in_chat_on", {
            msg: "해제가 완료되었습니다."
        });
    });

    socket.on('chat_exit', async (data) => {
        // data: {
        //     room_id: 3, // 나갈려는 방 아이디
        //     user_id: 3, // 내 아이디
        //     name: 'joon', // 내 아이디
        //     to: 2, // 상대방 아이디
        // }
        try {
            let msg = {
                user_id: 0,
                name: 'admin',
                image: null,
                content: `${data.name}님이 나가셨습니다.`,
                timestamp: new Date().getTime(),
                notice: 1,
                flag: 0
            }
            
            await firebaseApi.setMessage(res.id, msg);

            if (chat_users[data.to]) {
                socket.to(chat_users[data.to]).emit('send_chat_msg_on', msg)
            }

            firebaseApi.exit(data.room_id, data.user_id);
        } catch (e) {
            console.log(e)
        }
    });

    socket.on('disconnect', () => {
        let user_id = socketToUsers[socket.id];

        if (chat_users[user_id]) {
            delete chat_users[user_id];
            delete socketToUsers[socket.id];
        }

        if (inChat[user_id]) {
            delete inChat[user_id];
        }
        console.log('chat 연결해제')
    });
}

module.exports = init;