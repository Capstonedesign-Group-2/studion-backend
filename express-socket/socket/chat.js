const redisApi = require('../api/redisRoom.js');

let init = (io) => {
    let chat = io.of('/chat');
    chat['users'] = {};

    chat.on('connection', socket => {
        console.log('chat connection');
        console.log(`chat정보 ${socket.id}`);

        socket.on('user_register', data => {
            //data set 
            // id: 1 -> user_id
            if (chat.users[data.id]) {
                delete chat.users[data.id];
                chat.users[data.id] = socket.id;
            } else {
                chat.users[data.id] = socket.id;
            }

            chat.to(socket.id).emit('user_register_on', {
                msg: '등록이 완료되었습니다.',
                id: chat.users
            });

            console.log(`들어온 사람 ${chat.users[data.id]}`);
        });

        // 경우
        // 상대방이 로그인안했을때 메시지 flag컬럼으로 표시하고 레디스에 저장
        // 내가 소켓연결 끊으면 내가 보낸 메시지들 mysql로 옮기고 레디스 삭제
        // 그렇다면 emit이 안된 메시지들 만약 내가 소켓 연결이 안끊겨있는데
        // 상대방이 들어오면? 어떻게 되냐 당연 mysql에서 get해오고 
        // mysql에 없는 것은 레디스에 저장되어있으니 list로 저장해서 시간 순서대로
        // 같이 보낸다
        // 이랬을때 소켓에서 api를 처리할까 아니면 프론트에서 api를 처리할까 
        // 어처피 속도면에서 똑같다 차라리 이럴거면 걍 레디스에 때려박아도 되지않을까
        // 문제는 flag컬럼으로 저장을 한다해도 레디스에 남아있던 상태에서 보내면 flag칼럼을
        // 어찌해야될까 모든 메시지 get과 특정사람 메시지 get을 따라 만들어 관리
        // 모든 메시지는 칼럼변경을 하지않고 특정사람 메시지는 칼럼변경을 한다.
        // 여기서 모든 메시지를 get해왔을때도 mysql로 저장 및 레디스에서 삭제를 하면 개오바다.
        // chat 소켓 연결 맨처음에만 get을 한다면 상관은 없긴하다.
        // 그러면 결국 레디스에 어떻게 저장하느냐
        // 넣은 순서대로 나와야하기때문에 list or sorted set인데
        // ㅅㅂ 걍 로컬 데이터에 저장하고 싶다 그러면 안되는거 아니까 참는데 하...
        // 특정 메시지 방을 나갔을때 그때 보낸 메시지를 mysql에 보낼까?
        // 그냥 from to가 아니라 룸으로 특정짓고 from으로만 하면 편하긴하다.
        // 내가 특정룸이라고 생각되니까 룸을 어떻게 지정할건가 소켓 상으론 걍 private message
        // 데이터상에서만 룸으로 지정 그러면 이 룸을 어떻게 할건가
        // firebase realtime database이용해보자
        socket.on('send_msg', data => {
            // data = {
                //     id: 1 -> user_id
                //     name: 'joon',
                //     image: null,
                //     msg: 'hello'
                // }
            
            socket.to(chat.users[data.id]).emit('send_msg_on', data);
        });

        socket.on('disconnect', () => {
            console.log('chat 연결해제')
        });
    });
}

module.exports = init;