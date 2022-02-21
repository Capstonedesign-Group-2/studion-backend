const { connection } = require('../database/index.js');

const redisApi = {};
const roomHash = 'studion';

let client = null;

(async () => {
    client = await connection();
})();

redisApi.test = async (hash, key, value) => {
    
    // await client.hSet(hash, key, JSON.stringify(value));
    // let res = await client.hGet(hash, key);
    // let res = await client.hGetAll(hash);
    let res = JSON.parse(JSON.stringify(await client.hGetAll(roomHash)));
    let keys = await client.hKeys(roomHash);

    for (i = 0; i < keys.length; i++) {
        res[keys[i]] = JSON.parse(res[keys[i]]);
    }

    return res;
}

redisApi.getRoomList = async () => {
    try {
        let res = JSON.parse(JSON.stringify(await client.hGetAll(roomHash)));
        let keys = await client.hKeys(roomHash);
    
        for (i = 0; i < keys.length; i++) {
            res[keys[i]] = JSON.parse(res[keys[i]]);
        }
        
        return res;
    } catch (e) {
        console.log(e)
    }
}

redisApi.createRoom = async (key, value) => {
    // data set
    // room -> roomID 이건 Backend에서 만듬
    // creater -> name 
    // title -> room title
    // content -> room content
    // max -> room max people
    // locked -> 0 or 1 
    // password -> locked 1일 시
    if (value.looked) {
        // password 작업...
    }  

    try {
        let res = await client.hSet(roomHash, key, JSON.stringify(value), client.print);
        
        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.getRoomUser = async (hash) => {
    try {
        let res = JSON.parse(JSON.stringify(await client.hGetAll(hash)));
        let keys = await client.hKeys(hash);
    
        for (i = 0; i < keys.length; i++) {
            res[keys[i]] = JSON.parse(res[keys[i]]);
        }
    
        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.joinRoom = async (hash, key, value) => {
    try {
        let res = await client.hSet(hash, key, JSON.stringify(value), client.print);
        
        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.exitRoom = async (hash, key, value) => {

}

redisApi.destoryRoom = async (key, value) => {

}

redisApi.disconnect = async () => {
    await client.disconnect();
    console.log('disconnect redis');
}

module.exports = redisApi;