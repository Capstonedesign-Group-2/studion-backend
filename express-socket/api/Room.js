const { setting } = require('../http/index.js');

const createRoom = async (token, data) => {
    let res = await setting(token).post(
        'http://127.0.0.1:8000/api/rooms/create',
        data
    );

    return res;
}

const exitRoom = async (token, roomId, userId) => {
    let res = await setting(token).delete(
        `http://127.0.0.1:8000/api/rooms/exit/${roomId}`,
        { data: { user_id: userId }}
    );

    return res;
}

const destoryRoom = async (token, roomId, userId) => {
    let res = await setting(token).delete(
        `http://127.0.0.1:8000/api/rooms/destory/${roomId}`,
        { data: { user_id: userId }}
    );

    return res;
}

module.exports = { createRoom, exitRoom };