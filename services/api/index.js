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

import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import graphRouter from './routes/graph.js';
import analyticsRouter from './routes/analytics.js';
import cacheRouter from './routes/cache.js';

// --- Routes (mounted from modules) ---
app.get('/', (req, res) => {
  res.send('Polyglot Persistence API is running');
});

app.use('/users', usersRouter);
app.use('/posts', postsRouter);
// graphRouter contains '/follow' and '/relationships'
app.use('/', graphRouter);
app.use('/', analyticsRouter);
app.use('/', cacheRouter);

// --- Initialization sequence ---
async function start() {
  try {
    // PostgreSQL (Users)
    const pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    // TimescaleDB (Events)
    const tsPool = new pg.Pool({
      connectionString: process.env.TIMESCALE_URL,
    });

    // MongoDB (Posts)
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');
    const postSchema = new mongoose.Schema({
      user_id: String,
      author_id: String,
      title: String,
      body: String,
      tags: [String],
      meta: Map,
      created_at: { type: Date, default: Date.now }
    });
    const Post = mongoose.model('Post', postSchema);

    // Neo4j (Graph)
    const neoUser = process.env.NEO4J_USER || 'neo4j';
    const neoPass = process.env.NEO4J_PASSWORD || process.env.NEO4J_PASS || 'neo4jpass';
    const neo4jDriver = neo4j.driver(
      process.env.NEO4J_URL,
      neo4j.auth.basic(neoUser, neoPass)
    );

    // Redis (Cache)
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', err => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Connected to Redis');

    // Kafka
    const kafka = new Kafka({
      clientId: 'api-gateway',
      brokers: process.env.KAFKA_BROKER ? [process.env.KAFKA_BROKER] : []
    });
    const producer = kafka.producer();
    const consumer = kafka.consumer({ groupId: 'api-group' });

    async function connectKafka() {
      if (!process.env.KAFKA_BROKER) {
        console.warn('KAFKA_BROKER not set; skipping Kafka connection');
        return;
      }
      await producer.connect();
      await consumer.connect();
      await consumer.subscribe({ topic: 'db-changes', fromBeginning: true });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            value: message.value.toString(),
          });
        },
      });
      console.log('Connected to Kafka');
    }
    await connectKafka().catch(err => console.error('Kafka error', err));

    // Attach db clients to app locals for route handlers if needed
    app.locals.pgPool = pgPool;
    app.locals.tsPool = tsPool;
    app.locals.Post = Post;
    app.locals.neo4jDriver = neo4jDriver;
    app.locals.redisClient = redisClient;
    app.locals.kafkaProducer = producer;

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Central error handler
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err && err.stack ? err.stack : err);
      if (res.headersSent) return next(err);
      const status = err && err.status ? err.status : 500;
      res.status(status).json({ error: err && err.message ? err.message : 'Internal Server Error' });
    });

    app.listen(port, () => {
      console.log(`API listening at http://localhost:${port}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
start();

