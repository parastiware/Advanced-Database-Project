import express from 'express';
import { asyncHandler, safeRunNeo4j, getNeo4jDriver, getKafkaProducer } from '../lib/helpers.js';

const router = express.Router();

// Create follow relationship
router.post('/follow', asyncHandler(async (req, res) => {
  const { followerId, followeeId } = req.body;
  if (!followerId || !followeeId) return res.status(400).json({ error: 'followerId and followeeId are required' });
  if (followerId === followeeId) return res.status(400).json({ error: 'A user cannot follow themselves' });

  const driver = getNeo4jDriver(req);
  if (!driver) throw new Error('Neo4j driver not initialized');

  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId}), (b:User {id: $followeeId})
       MERGE (a)-[rel:FOLLOWS]->(b)
       RETURN a.id as followerId, b.id as followeeId, rel`,
      { followerId, followeeId }
    );

    if (result.records.length === 0) return res.status(404).json({ error: 'One or both users not found in Neo4j' });

    // Publish event to Kafka
    const producer = getKafkaProducer(req);
    if (producer) {
      try {
        await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'FOLLOW_CREATED', data: { followerId, followeeId } }) }] });
      } catch (e) {
        console.warn('Failed to publish FOLLOW_CREATED:', e.message);
      }
    }

    res.json({ status: 'success', followerId, followeeId, message: 'Relationship created successfully' });
  } finally {
    await session.close();
  }
}));

// Get relationships
router.get('/relationships', asyncHandler(async (req, res) => {
  const driver = getNeo4jDriver(req);
  if (!driver) return res.json([]);

  const session = driver.session();
  try {
    const result = await session.run(`MATCH (a:User)-[rel:FOLLOWS]->(b:User) RETURN a.id as followerId, a.name as followerName, b.id as followeeId, b.name as followeeName`);
    const relationships = result.records.map(r => ({
      followerId: r.get('followerId'),
      followerName: r.get('followerName'),
      followeeId: r.get('followeeId'),
      followeeName: r.get('followeeName')
    }));
    res.json(relationships);
  } finally {
    await session.close();
  }
}));

export default router;
