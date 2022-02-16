const { connection } = require('../database/index.js');

const redisApi = {};

let client = null;

(async () => {
    client = await connection();
})();

redisApi.test = async (hash, key, value) => {
    
    // await client.hSet(hash, key, JSON.stringify(value));
    // let res = await client.hGet(hash, key);
    // let res = await client.hGetAll(hash);
    let res = JSON.parse(JSON.stringify(await client.hGetAll(hash)));
    let keys = await client.hKeys(hash);

    for (i = 0; i < keys.length; i++) {
        res[keys[i]] = JSON.parse(res[keys[i]]);
    }

    return res;
}

redisApi.getRoomList = async (hash, key, value) => {

}

redisApi.createRoom = async (hash, key, value) => {

}

redisApi.joinRoom = async (hash, key, value) => {

}

redisApi.exitRoom = async (hash, key, value) => {

}

redisApi.destoryRoom = async (hash, key, value) => {

}

redisApi.disconnect = async () => {
    await client.disconnect();
    console.log('disconnect redis');
}

module.exports = redisApi;