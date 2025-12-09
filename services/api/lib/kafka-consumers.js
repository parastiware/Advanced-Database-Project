/**
 * Kafka Consumers for Event Processing
 * Handles consuming events from Kafka and syncing to various databases
 */

export async function startKafkaConsumers(consumer, tsPool, redisClient, neo4jDriver) {
  try {
    await consumer.subscribe({ topic: 'db-changes', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          const { type, data } = eventData;

          console.log(`📨 Kafka Event: ${type}`, data);

          // Route event to appropriate handlers
          switch (type) {
            case 'USER_CREATED':
              await handleUserCreated(data, tsPool, redisClient);
              break;
            case 'USER_UPDATED':
              await handleUserUpdated(data, tsPool, redisClient);
              break;
            case 'USER_DELETED':
              await handleUserDeleted(data, tsPool, redisClient, neo4jDriver);
              break;
            case 'POST_CREATED':
              await handlePostCreated(data, tsPool);
              break;
            case 'POST_UPDATED':
              await handlePostUpdated(data, tsPool);
              break;
            case 'POST_DELETED':
              await handlePostDeleted(data, tsPool);
              break;
            case 'FOLLOW_CREATED':
              await handleFollowCreated(data, tsPool);
              break;
            default:
              console.warn(`Unknown event type: ${type}`);
          }
        } catch (err) {
          console.error('Error processing Kafka message:', err);
        }
      },
    });

    console.log('✅ Kafka Consumer started and listening for events');
  } catch (err) {
    console.error('Failed to start Kafka consumer:', err);
    throw err;
  }
}

/**
 * Handle USER_CREATED event
 * - Log to TimescaleDB
 * - Cache user profile in Redis
 */
async function handleUserCreated(userData, tsPool, redisClient) {
  try {
    // Insert into TimescaleDB events table
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'user_created', $2)`,
        [userData.id, JSON.stringify({ user_id: userData.id, email: userData.email, name: userData.name })]
      );
      console.log(`✅ TimescaleDB: Logged USER_CREATED event for ${userData.email}`);
    }

    // Cache user profile in Redis
    if (redisClient) {
      const cacheKey = `user:${userData.id}:profile`;
      await redisClient.setEx(
        cacheKey,
        3600, // 1 hour TTL
        JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          created_at: userData.created_at
        })
      );
      console.log(`✅ Redis: Cached user profile for ${userData.email}`);
    }
  } catch (err) {
    console.error('Error handling USER_CREATED:', err);
  }
}

/**
 * Handle USER_UPDATED event
 * - Log to TimescaleDB
 * - Update Redis cache
 */
async function handleUserUpdated(userData, tsPool, redisClient) {
  try {
    // Insert into TimescaleDB events table
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'user_updated', $2)`,
        [userData.id, JSON.stringify({ user_id: userData.id, email: userData.email, name: userData.name })]
      );
      console.log(`✅ TimescaleDB: Logged USER_UPDATED event for ${userData.email}`);
    }

    // Update Redis cache
    if (redisClient) {
      const cacheKey = `user:${userData.id}:profile`;
      await redisClient.setEx(
        cacheKey,
        3600,
        JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          updated_at: userData.updated_at
        })
      );
      console.log(`✅ Redis: Updated user profile cache for ${userData.email}`);
    }
  } catch (err) {
    console.error('Error handling USER_UPDATED:', err);
  }
}

/**
 * Handle USER_DELETED event
 * - Log to TimescaleDB
 * - Remove from Redis cache
 * - Remove from Neo4j
 */
async function handleUserDeleted(userData, tsPool, redisClient, neo4jDriver) {
  try {
    // Insert into TimescaleDB events table
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'user_deleted', $2)`,
        [userData.id, JSON.stringify({ user_id: userData.id, email: userData.email })]
      );
      console.log(`✅ TimescaleDB: Logged USER_DELETED event for ${userData.email}`);
    }

    // Remove from Redis cache
    if (redisClient) {
      const cacheKey = `user:${userData.id}:profile`;
      await redisClient.del(cacheKey);
      console.log(`✅ Redis: Removed user profile cache for ${userData.email}`);
    }

    // Remove from Neo4j
    if (neo4jDriver) {
      const session = neo4jDriver.session();
      try {
        await session.run('MATCH (u:User {id: $id}) DETACH DELETE u', { id: userData.id });
        console.log(`✅ Neo4j: Deleted user node for ${userData.email}`);
      } finally {
        await session.close();
      }
    }
  } catch (err) {
    console.error('Error handling USER_DELETED:', err);
  }
}

/**
 * Handle POST_CREATED event
 * - Log to TimescaleDB
 */
async function handlePostCreated(postData, tsPool) {
  try {
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'post_created', $2)`,
        [postData.author_id, JSON.stringify({ post_id: postData._id, title: postData.title, author_id: postData.author_id })]
      );
      console.log(`✅ TimescaleDB: Logged POST_CREATED event for "${postData.title}"`);
    }
  } catch (err) {
    console.error('Error handling POST_CREATED:', err);
  }
}

/**
 * Handle POST_UPDATED event
 * - Log to TimescaleDB
 */
async function handlePostUpdated(postData, tsPool) {
  try {
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'post_updated', $2)`,
        [postData.author_id, JSON.stringify({ post_id: postData._id, title: postData.title, author_id: postData.author_id })]
      );
      console.log(`✅ TimescaleDB: Logged POST_UPDATED event for "${postData.title}"`);
    }
  } catch (err) {
    console.error('Error handling POST_UPDATED:', err);
  }
}

/**
 * Handle POST_DELETED event
 * - Log to TimescaleDB
 */
async function handlePostDeleted(postData, tsPool) {
  try {
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'post_deleted', $2)`,
        [postData.author_id, JSON.stringify({ post_id: postData._id, title: postData.title, author_id: postData.author_id })]
      );
      console.log(`✅ TimescaleDB: Logged POST_DELETED event for "${postData.title}"`);
    }
  } catch (err) {
    console.error('Error handling POST_DELETED:', err);
  }
}

/**
 * Handle FOLLOW_CREATED event
 * - Log to TimescaleDB
 */
async function handleFollowCreated(followData, tsPool) {
  try {
    if (tsPool) {
      await tsPool.query(
        `INSERT INTO events (time, user_id, event_type, properties)
         VALUES (now(), $1, 'follow_created', $2)`,
        [followData.followerId, JSON.stringify({ follower_id: followData.followerId, followee_id: followData.followeeId })]
      );
      console.log(`✅ TimescaleDB: Logged FOLLOW_CREATED event`);
    }
  } catch (err) {
    console.error('Error handling FOLLOW_CREATED:', err);
  }
}
