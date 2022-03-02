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

redisApi.getRoomCount = async () => {
    try {
        let keys = await client.hKeys(roomHash);

        return keys.length;
    } catch (e) {
        console.log(e);
    }
}

redisApi.getRoomList = async () => {
    try {
        let res = JSON.parse(JSON.stringify(await client.hGetAll(roomHash)));
        let keys = await client.hKeys(roomHash);
        console.log(keys);
        let obj = {};
        obj['rooms'] = new Array();

        for (i = 0; i < keys.length; i++) {
            let userKeys = await client.hKeys(keys[i]);
            if (userKeys.length !== 0) {
                res[keys[i]] = JSON.parse(res[keys[i]]);
                let userRes = JSON.parse(JSON.stringify(await client.hGetAll(keys[i])));
                let arr = new Array();
     
                for (j = 0; j < userKeys.length; j++) {
                    arr.push(JSON.parse(userRes[userKeys[j]]));
                }
    
                res[keys[i]]['users'] = arr;
    
                // obj[keys[i]] = res[keys[i]];
                obj['rooms'].push(res[keys[i]]);
            }
        }

        return obj;
    } catch (e) {
        console.log(e)
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

redisApi.getRoomInfo = async (key) => {
    try {
        let res = JSON.parse(await client.hGet(roomHash, key));

        let users = JSON.parse(JSON.stringify(await client.hGetAll(key)));
        let keys = await client.hKeys(key);
        let arr = new Array();

        for (i = 0; i < keys.length; i++) {
            arr.push(JSON.parse(users[keys[i]]));
        }
        res['users'] = arr;
        
        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.createRoom = async (key, value) => {
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

redisApi.joinRoom = async (hash, key, value) => {
    try {
        let res = await client.hSet(hash, key, JSON.stringify(value), client.print);
        
        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.exitRoom = async (hash, key) => {
    try {
        let res = await client.hDel(hash, key, client.print);

        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.destoryRoom = async (key) => {
    try {
        let res = await client.hDel(roomHash, key, client.print);

        return res;
    } catch (e) {
        console.log(e);
    }
}

redisApi.disconnect = async () => {
    await client.disconnect();
    console.log('disconnect redis');
}

module.exports = redisApi;