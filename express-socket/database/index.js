import { createClient } from "redis";

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = process.env.REDIS_PORT || 6379;
const password = process.env.REDIS_PASSWORD || '';

let connection = async () => {
    try {
        const client = createClient(port, host);
        client.auth(password);

        return client;
    } catch (e) {
        return createClient();
    }
}
