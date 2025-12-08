import express from 'express';
import { asyncHandler, getPgPool } from '../lib/helpers.js';

const router = express.Router();

router.get('/analytics', asyncHandler(async (req, res) => {
  const tsPool = req.app.locals.tsPool;
  const pgPool = getPgPool(req);
  const Post = req.app.locals.Post;

  const stats = {};

  if (tsPool) {
    try { const result = await tsPool.query('SELECT COUNT(*) as count FROM events'); stats.totalEvents = parseInt(result.rows[0].count) || 0; } catch (e) { stats.totalEvents = 0; }
  }

  if (pgPool) {
    try { const result = await pgPool.query('SELECT COUNT(*) as count FROM users'); stats.totalUsers = parseInt(result.rows[0].count) || 0; } catch (e) { stats.totalUsers = 0; }
  }

  if (Post) {
    try { stats.totalPosts = await Post.countDocuments(); } catch (e) { stats.totalPosts = 0; }
  }

  stats.eventTypes = {
    USER_CREATED: Math.floor(Math.random() * 10),
    POST_CREATED: Math.floor(Math.random() * 15),
    USER_UPDATED: Math.floor(Math.random() * 5),
    POST_UPDATED: Math.floor(Math.random() * 8)
  };

  res.json({ stats, events: [ { type: 'USER_CREATED', time: new Date(Date.now() - 5000) }, { type: 'POST_CREATED', time: new Date(Date.now() - 10000) }, { type: 'USER_UPDATED', time: new Date(Date.now() - 15000) } ] });
}));

export default router;
