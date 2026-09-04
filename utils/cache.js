const redis = require('redis');

let client = null;
const useCache = process.env.USE_CACHE === 'true';

if (useCache) {
  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  client.connect().then(() => {
    console.log('Redis connected');
  }).catch(err => {
    console.error('Failed to connect to Redis', err);
  });
}

const getCache = async (key) => {
  if (!useCache || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error', err);
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  if (!useCache || !client) return;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error', err);
  }
};

const delCache = async (keys) => {
  if (!useCache || !client) return;
  try {
    if (Array.isArray(keys)) {
      for (const key of keys) {
        await client.del(key);
      }
    } else {
      await client.del(keys);
    }
  } catch (err) {
    console.error('Cache del error', err);
  }
};

module.exports = {
  getCache,
  setCache,
  delCache,
  useCache
};

