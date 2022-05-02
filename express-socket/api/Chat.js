const db = require('../database/firebase.js');

let setChatDoc = (room_id) => {
    const chats = db.collection('chats').doc(room_id.toString());
    
    return chats;
}

let setMessageDoc = (room_id) => {
    const messages = db.collection('chats').doc(room_id.toString()).collection('messages').doc();

    return messages;
}

let setMemberDoc = (room_id) => {
    const members = db.collection('chats').doc(room_id.toString()).collection('members').doc();

    return members;
}

let getCount = async () => {
    const count = (await db.collection('chats').get()).size + 1;

    return count;
}

// 내가 포함된 모든채팅 가져오기
// clear
exports.getChats = async (from) => {
    const query = await db.collection('chats')
        .where('users', 'array-contains', from)
        .orderBy('timestamp', 'desc')
        .get();

    let res = {
        data: []
    }
    
    // const query2 = db.collection('members').get();
    query.forEach((doc) => {
        let tmp = doc.data();
        tmp['id'] = doc.id;
        res.data.push(tmp);
    });

    for (let i = 0; i < res.data.length; i++) {
        const membersRef = db.collection('chats').doc(res.data[i].id.toString()).collection('members');
        const query3 = await membersRef.get();
        query3.forEach((doc) => {
            let tmp = doc.data();
            if (tmp.user_id != from) {
                res.data[i].to = tmp;
            }
        });
    }

    return res;
}

// 특정방 정보 보기
exports.getChatData = async (data) => {
    const query = db.collection('chats').doc(data.room_id.toString());
    const doc = await query.get();
    let res = doc.data();
    
    for (let i = 0; i < res.users.length; i++) {
        if (res.users[i] !== data.user_id) {
            return res.users[i];
        }
    }
}

// let data = async () => {
//     let res= await getChats(1);
//     console.log(res, '/ data in')

//     return res;
// }

// data()
// 채팅 만들기
// test clear
exports.setChat = async (data) => {
    // data set 
    // 나와 상대 user 정보
    // user_id, name, image

    let res = await ok(data[0].user_id, data[1].user_id);
    
    if (res.flag) {
        return res;
    }

    let arr = new Array();
    
    let count = await getCount();

    for (let i = 0; i < data.length; i++) {
        data[i].flag = true;

        try {
            const memberDoc = setMemberDoc(count);
            memberDoc.set(data[i]);
            arr.push(data[i].user_id);
        } catch (e) {
            console.log(e)
        }
    }

    const chatDoc = setChatDoc(count);
    
    try {
        chatDoc.set({
            users: arr
        }, { merge: true })
    } catch (e) {
        console.log(e)
    }

    res = {
        id: count,
        flag: 0
    }
    
    return res;
}

let ok = async (to, from) => {
    let res = {
        id: 0,
        flag: 0
    };

    const query = await db.collection('chats')
        .where('users', 'array-contains', from)
        .get();

    query.forEach((doc) => {
        if (res.flag) return;
        let tmp = doc.data();

        for (let i = 0; i < tmp.users.length; i++) {
            if (tmp.users[i] == to) {
                res.id = doc.id;
                res.flag = 1;
                break;
            }
        }
    });

    return res;   
}

// setChat([
//     {
//         user_id: 1,
//         name: 'joon',
//         image: null,
//         flag: true
//     },
//     {
//         user_id: 3,
//         name: 'ppang',
//         image: null,
//         flag: true
//     }
// ]);

// 메시지 보내기 저장
// test clear
exports.setMessage = async (room_id, msg) => {
    //data set
    // name, content
    const chatDoc = setChatDoc(room_id);
    const msgDoc= setMessageDoc(room_id);
    try {
        msgDoc.set(msg);
        chatDoc.set({
            lastMsg: msg.content,
            timestamp: msg.timestamp
        }, { merge: true });
    } catch (e) {
        console.log(e)
    }
}

// setMessage(2, {
//     user_id: 2,
//     name: 'dong',
//     image: null,
//     content: 'test2 flag',
//     timestamp: new Date().getTime(),
//     flag: 1 // 0이면 확인한 메시지, 1 이면 확인안한 메시지
// });

// 한 채팅방의 모든 메시지 가져오기 읽음 안읽음까지 
// clear
exports.getMessages = async (room_id, user_id) => {
    const messagesRef = db.collection('chats').doc(room_id.toString()).collection('messages');

    const flag = await messagesRef.where('flag', '==', 1)
        .where('user_id', '==', user_id)
        .get();

    if (flag.size !== 0) {
        console.log(flag.size, '/size')
        flag.forEach((doc) => {
            console.log(doc.id, '/flag')
            messagesRef.doc(doc.id).set({
                flag: 0
            }, { merge: true });
        });
    }

    const query = await messagesRef.orderBy('timestamp').get();

    let res = new Array();

    query.forEach((doc) => {
        res.push(doc.data());
    });

    return res;
}

// let getMsg = async () => {
//     let res = await getMessages(2, 1);
//     console.log(res, '/ ', res.length);
// }

// getMsg();

// 한 채팅방 나가기
// clear
exports.exit = async (room_id, user_id) => {
    const chatDoc = setChatDoc(room_id);
    // const query = (await chatDoc.get()).data();

    // for (let i = 0; i < query.users.length; i++) {
    //     if (query.users[i] !== user_id) {
    //         chatDoc.set({
    //             users: [query.users[i]]
    //         }, { merge: true });

    //         break;
    //     }
    // }

    const memberRef = db.collection('chats').doc(room_id.toString()).collection('members');
    const query2 = await memberRef.where('user_id', '==', user_id).get();

    query2.forEach((doc) => {
        memberRef.doc(doc.id).delete();
    });
}

// exit(1, 1);