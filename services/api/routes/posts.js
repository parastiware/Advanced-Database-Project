import express from 'express';
import { asyncHandler, getPgPool, getKafkaProducer } from '../lib/helpers.js';

const router = express.Router();

// Create post
router.post('/', asyncHandler(async (req, res) => {
  const Post = req.app.locals.Post;
  if (!Post) throw new Error('Mongo Post model not initialized');
  const post = new Post(req.body);
  await post.save();

  const producer = getKafkaProducer(req);
  if (producer) {
    try {
      await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'POST_CREATED', data: post }) }] });
    } catch (e) { console.warn('Failed to publish POST_CREATED:', e.message); }
  }

  res.json(post);
}));

// List posts with enrichment
router.get('/', asyncHandler(async (req, res) => {
  const Post = req.app.locals.Post;
  const pgPool = getPgPool(req);
  if (!Post) throw new Error('Mongo Post model not initialized');

  const posts = await Post.find();
  const enrichedPosts = await Promise.all(posts.map(async (post) => {
    const postObj = post.toObject();
    const userId = postObj.user_id || postObj.author_id;
    if (userId && pgPool) {
      try {
        const userRes = await pgPool.query('SELECT id, name, email FROM users WHERE id=$1', [userId]);
        if (userRes.rows.length > 0) postObj.user = userRes.rows[0];
      } catch (e) { console.warn('Failed to fetch user for post:', e.message); }
    }
    return postObj;
  }));

  res.json(enrichedPosts);
}));

// Update post
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Post = req.app.locals.Post;
  if (!Post) throw new Error('Mongo Post model not initialized');
  const post = await Post.findByIdAndUpdate(id, req.body, { new: true });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const producer = getKafkaProducer(req);
  if (producer) {
    try { await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'POST_UPDATED', data: post }) }] }); } catch (e) { console.warn('Failed to publish POST_UPDATED:', e.message); }
  }

  res.json(post);
}));

// Delete post
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const Post = req.app.locals.Post;
  if (!Post) throw new Error('Mongo Post model not initialized');
  const post = await Post.findByIdAndDelete(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const producer = getKafkaProducer(req);
  if (producer) {
    try { await producer.send({ topic: 'db-changes', messages: [{ value: JSON.stringify({ type: 'POST_DELETED', data: { id } }) }] }); } catch (e) { console.warn('Failed to publish POST_DELETED:', e.message); }
  }

  res.json({ status: 'deleted', id });
}));

export default router;
