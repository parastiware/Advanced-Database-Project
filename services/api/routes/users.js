import express from 'express';
import { asyncHandler, getPgPool, getNeo4jDriver, getKafkaProducer, safeRunNeo4j } from '../lib/helpers.js';

const router = express.Router();

// Create user
router.post('/', asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;
  const pool = getPgPool(req);
  if (!pool) throw new Error('Postgres pool not initialized');

  const result = await pool.query(
    'INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING *',
    [email, name, password]
  );
  const user = result.rows[0];

  // create in neo4j if available
  try {
    await safeRunNeo4j(req, 'MERGE (u:User {id: $id, name: $name, email: $email})', { id: user.id, name: user.name, email: user.email });
  } catch (e) {
    console.warn('Neo4j user create failed:', e.message);
  }

  const producer = getKafkaProducer(req);
  if (producer) {
    try {
      await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'USER_CREATED', data: user }) }] });
    } catch (e) {
      console.warn('Failed to publish USER_CREATED:', e.message);
    }
  }

  res.json(user);
}));

// List users
router.get('/', asyncHandler(async (req, res) => {
  const pool = getPgPool(req);
  if (!pool) throw new Error('Postgres pool not initialized');
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
}));

// Update user
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, name, password } = req.body;
  const pool = getPgPool(req);
  if (!pool) throw new Error('Postgres pool not initialized');

  const result = await pool.query(
    'UPDATE users SET email=$1, name=$2, hashed_password=COALESCE($3, hashed_password), updated_at=now() WHERE id=$4 RETURNING *',
    [email, name, password ?? null, id]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const producer = getKafkaProducer(req);
  if (producer) {
    try {
      await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'USER_UPDATED', data: user }) }] });
    } catch (e) {
      console.warn('Failed to publish USER_UPDATED:', e.message);
    }
  }

  res.json(user);
}));

// Delete user
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pool = getPgPool(req);
  if (!pool) throw new Error('Postgres pool not initialized');

  const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING *', [id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    await safeRunNeo4j(req, 'MATCH (u:User {id: $id}) DETACH DELETE u', { id });
  } catch (e) {
    console.warn('Failed to delete user from Neo4j:', e.message);
  }

  const producer = getKafkaProducer(req);
  if (producer) {
    try {
      await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'USER_DELETED', data: { id } }) }] });
    } catch (e) {
      console.warn('Failed to publish USER_DELETED:', e.message);
    }
  }

  res.json({ status: 'deleted', id });
}));

export default router;
