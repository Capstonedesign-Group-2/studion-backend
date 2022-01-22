const htp = require('../http/index.js');

const obj = {};

obj.createRoom = async (token, data) => {
    let res = await htp.setting(token).post(
        '/rooms/create',
        data
    );
    
    return res.data;
}

obj.roomList = async () => {
    let res = await htp.setting().get(
        '/rooms/show'
    );

    return res.data;
}

obj.enterRoom = async (token, roomId, data) => {
    let res = await htp.setting(token).post(
        `/rooms/enter/${roomId}`,
        data
    );

    return res.data;
}

obj.updateRoom = async (token, roomId, data) => {
    let res = await htp.setting(token).patch(
        `/rooms/update/${roomId}`,
        data
    );

    return res.data;
}

obj.exitRoom = async (token, roomId, userId) => {
    let res = await htp.setting(token).delete(
        `/rooms/exit/${roomId}`,
        { data: { user_id: userId }}
    );

    return res.data;
}

obj.destoryRoom = async (token, roomId, userId) => {
    let res = await htp.setting(token).delete(
        `/rooms/destory/${roomId}`,
        { data: { user_id: userId }}
    );

    return res.data;
}

obj.test = async () => {
    let res = await htp.setting().get(
        '/test'
    );

    return res.data;
}

module.exports = obj;