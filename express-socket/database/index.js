const { createClient } = require('redis');

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = process.env.REDIS_PORT || 6379;
const password = process.env.REDIS_PASSWORD || 'password';

let connection = async () => {
    try {
        const client = createClient({
            url: 'redis://default:'+ password + '@' + host + ':' + port
        });

        client.on('error', (err) => {
            console.log(err);
        });

        await client.connect();

        return client;
    } catch (e) {
        return createClient();
    }
}

module.exports = { connection };
