const { connection } = require('../database/index.js');

const redisApi = {};

let client = null;

(async () => {
    client = await connection();
})();

redisApi.test = async (key, value) => {
    let res = await client.set(key, value);
    let res = await client.get(key);

    return res;
}

module.exports = redisApi;