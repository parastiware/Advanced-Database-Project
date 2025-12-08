import neo4j from 'neo4j-driver';

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const getPgPool = (req) => req.app.locals.pgPool;
export const getNeo4jDriver = (req) => req.app.locals.neo4jDriver;
export const getKafkaProducer = (req) => req.app.locals.kafkaProducer;
export const getRedisClient = (req) => req.app.locals.redisClient;

export const safeRunNeo4j = async (req, cypher, params = {}) => {
  const driver = getNeo4jDriver(req);
  if (!driver) throw new Error('Neo4j driver not initialized');
  const session = driver.session();
  try {
    return await session.run(cypher, params);
  } finally {
    await session.close();
  }
};

export default {
  asyncHandler,
  getPgPool,
  getNeo4jDriver,
  getKafkaProducer,
  getRedisClient,
  safeRunNeo4j
};
