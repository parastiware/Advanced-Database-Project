import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(json());

// --- Database Connections ---

// PostgreSQL (Users)
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// MongoDB (Posts)
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const postSchema = new mongoose.Schema({
  author_id: String,
  title: String,
  body: String,
  tags: [String],
  meta: Map,
  created_at: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

// Neo4j (Graph)
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URL,
  neo4j.auth.basic('neo4j', 'neo4jpass') // Hardcoded for demo, should be env var
);

// Redis (Cache)
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', err => console.error('Redis Client Error', err));
await redisClient.connect().catch(console.error);

// TimescaleDB (Events) - reusing pg driver but different connection if needed, 
// or same if in same DB. In docker-compose they are separate services.
const tsPool = new pg.Pool({
  connectionString: process.env.TIMESCALE_URL,
});

// Kafka
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: [process.env.KAFKA_BROKER]
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'api-group' });

async function connectKafka() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'db-changes', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
      // Handle events here (e.g., sync to Neo4j/Redis)
    },
  });
}
connectKafka().catch(console.error);

// --- Routes ---

app.get('/', (req, res) => {
  res.send('Polyglot Persistence API is running');
});

// Users (Postgres)
app.post('/users', async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const result = await pgPool.query(
      'INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING *',
      [email, name, password] // In real app, hash password!
    );
    const user = result.rows[0];

    // Publish event
    await producer.send({
      topic: 'db-changes',
      messages: [{ value: JSON.stringify({ type: 'USER_CREATED', data: user }) }],
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Posts (MongoDB)
app.post('/posts', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();

    await producer.send({
      topic: 'db-changes',
      messages: [{ value: JSON.stringify({ type: 'POST_CREATED', data: post }) }],
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graph (Neo4j)
app.post('/follow', async (req, res) => {
  const { followerId, followeeId } = req.body;
  const session = neo4jDriver.session();
  try {
    await session.run(
      'MATCH (a:User {id: $followerId}), (b:User {id: $followeeId}) MERGE (a)-[:FOLLOWS]->(b)',
      { followerId, followeeId }
    );
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
