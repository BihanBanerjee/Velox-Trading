import Redis from 'ioredis';

const host = process.env.REDIS_HOST || 'localhost';
const port = Number(process.env.REDIS_PORT || 6380);

const redisClient = new Redis({
    host,
    port,
});

export default redisClient;