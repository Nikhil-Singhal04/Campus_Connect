const express = require('express');
const { all, get, run } = require('../db');
const { requireSession } = require('../middleware/sessionAuth');

const router = express.Router();

const CLUB_ALIASES = {
  entrepreneurship: 'entre',
  cultural: 'culture'
};

function normalizeClubId(value) {
  const raw = String(value || '').trim();
  return CLUB_ALIASES[raw] || raw || null;
}

function normalizePostRow(row) {
  return {
    id: row.id,
    author: row.authorName,
    text: row.text,
    createdAt: row.createdAt,
    likes: Number(row.likes || 0),
    club: normalizeClubId(row.club),
    image: row.image || null,
    replyToId: row.replyToId ? Number(row.replyToId) : null,
    replyToAuthor: row.replyToAuthor || null,
    replyToText: row.replyToText || null,
    comments: []
  };
}

async function ensureCommunityColumns() {
  await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS club TEXT`);
  await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image TEXT`);
  await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reply_to_id INTEGER`);
  await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reply_to_author TEXT`);
  await run(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reply_to_text TEXT`);
}

ensureCommunityColumns().catch((error) => {
  console.error('Failed to ensure community_posts columns', error);
});

// List posts
router.get('/posts', (req, res) => {
  (async () => {
    try {
      const posts = await all(
        `SELECT p.id,
                p.author_name AS "authorName",
                p.text,
                p.club,
                p.image,
                p.reply_to_id AS "replyToId",
                p.reply_to_author AS "replyToAuthor",
                p.reply_to_text AS "replyToText",
                p.created_at AS "createdAt",
                COALESCE(l.like_count, 0) AS likes
         FROM community_posts p
         LEFT JOIN (
           SELECT post_id, COUNT(*)::int AS like_count
           FROM community_post_likes
           GROUP BY post_id
         ) l ON l.post_id = p.id
         ORDER BY p.created_at DESC`
      );

      const comments = await all(
        `SELECT id,
                post_id AS "postId",
                author_name AS "authorName",
                text,
                created_at AS "createdAt"
         FROM community_post_comments
         ORDER BY created_at ASC`
      );

      const commentsByPost = new Map();
      for (const comment of comments) {
        const current = commentsByPost.get(comment.postId) || [];
        current.push({
          id: comment.id,
          author: comment.authorName,
          text: comment.text,
          createdAt: comment.createdAt
        });
        commentsByPost.set(comment.postId, current);
      }

      const normalized = posts.map((post) => ({
        ...normalizePostRow(post),
        comments: commentsByPost.get(post.id) || []
      }));

      return res.json({ posts: normalized });
    } catch (error) {
      console.error('List community posts error', error);
      return res.status(500).json({ message: 'Could not fetch community posts.' });
    }
  })();
});

// Create post
router.post('/posts', requireSession, (req, res) => {
  (async () => {
    try {
      const text = String(req.body.text || '').trim();
      const image = req.body.image || null;
      const club = normalizeClubId(req.body.club);
      if (!text && !image) return res.status(400).json({ message: 'Post text or image is required.' });

      if (club) {
        const canonical = club === 'entre' ? 'entrepreneurship' : club === 'culture' ? 'cultural' : club;
        const clubRow = await get(`SELECT id FROM clubs WHERE id = ?`, [canonical]);
        if (!clubRow) {
          return res.status(404).json({ message: 'Club not found.' });
        }
      }

      const user = await get(
        `SELECT id, username, first_name AS "firstName", last_name AS "lastName"
         FROM users
         WHERE id = ?`,
        [req.sessionUser.userId]
      );

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      const authorName = String(req.body.author || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Student').trim();
      const replyToId = req.body.replyToId ? Number(req.body.replyToId) : null;
      const replyToAuthor = req.body.replyToAuthor ? String(req.body.replyToAuthor).trim() : null;
      const replyToText = req.body.replyToText ? String(req.body.replyToText).trim() : null;
      const createdAt = Date.now();
      const result = await run(
        `INSERT INTO community_posts (author_user_id, author_name, text, club, image, like_count, created_at, reply_to_id, reply_to_author, reply_to_text)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
         RETURNING id, author_name, text, club, image, created_at, like_count`,
        [req.sessionUser.userId, authorName, text, club, image, createdAt, replyToId, replyToAuthor, replyToText]
      );

      const postId = result.lastID;
      const post = await get(
        `SELECT id,
                author_name AS "authorName",
                text,
                club,
                image,
                reply_to_id AS "replyToId",
                reply_to_author AS "replyToAuthor",
                reply_to_text AS "replyToText",
                created_at AS "createdAt",
                like_count AS likes
         FROM community_posts
         WHERE id = ?`,
        [postId]
      );

      return res.status(201).json({ post: { ...normalizePostRow(post), comments: [] } });
    } catch (err) {
      console.error('Create post error', err);
      return res.status(500).json({ message: 'Could not create post.' });
    }
  })();
});

// Like post
router.post('/posts/:id/like', requireSession, (req, res) => {
  (async () => {
    try {
      const postId = Number(req.params.id);
      if (!Number.isFinite(postId)) return res.status(400).json({ message: 'Invalid id.' });

      const post = await get(`SELECT id, like_count FROM community_posts WHERE id = ?`, [postId]);
      if (!post) return res.status(404).json({ message: 'Post not found.' });

      const existing = await get(
        `SELECT id FROM community_post_likes WHERE post_id = ? AND user_id = ?`,
        [postId, req.sessionUser.userId]
      );

      if (!existing) {
        await run(
          `INSERT INTO community_post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`,
          [postId, req.sessionUser.userId, Date.now()]
        );
      }

      const updated = await get(
        `SELECT id,
                author_name AS "authorName",
                text,
                club,
                created_at AS "createdAt",
                like_count AS likes
         FROM community_posts
         WHERE id = ?`,
        [postId]
      );

      return res.json({ post: { ...normalizePostRow(updated), comments: [] } });
    } catch (err) {
      if (String(err?.code || '') === '23505') {
        const updated = await get(
          `SELECT id,
                  author_name AS "authorName",
                  text,
                  club,
                  created_at AS "createdAt",
                  like_count AS likes
           FROM community_posts
           WHERE id = ?`,
          [Number(req.params.id)]
        );
        return res.json({ post: { ...normalizePostRow(updated), comments: [] } });
      }
      console.error('Like post error', err);
      return res.status(500).json({ message: 'Could not like post.' });
    }
  })();
});

// Comment
router.post('/posts/:id/comments', requireSession, (req, res) => {
  (async () => {
    try {
      const postId = Number(req.params.id);
      const text = String(req.body.text || '').trim();
      if (!Number.isFinite(postId)) return res.status(400).json({ message: 'Invalid id.' });
      if (!text) return res.status(400).json({ message: 'Comment text is required.' });

      const post = await get(`SELECT id FROM community_posts WHERE id = ?`, [postId]);
      if (!post) return res.status(404).json({ message: 'Post not found.' });

      const user = await get(
        `SELECT id, username, first_name AS "firstName", last_name AS "lastName"
         FROM users
         WHERE id = ?`,
        [req.sessionUser.userId]
      );

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      const authorName = String(req.body.author || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Student').trim();
      const createdAt = Date.now();
      const result = await run(
        `INSERT INTO community_post_comments (post_id, author_user_id, author_name, text, created_at)
         VALUES (?, ?, ?, ?, ?)
         RETURNING id`,
        [postId, req.sessionUser.userId, authorName, text, createdAt]
      );

      return res.status(201).json({
        comment: {
          id: result.lastID,
          author: authorName,
          text,
          createdAt
        }
      });
    } catch (err) {
      console.error('Comment post error', err);
      return res.status(500).json({ message: 'Could not add comment.' });
    }
  })();
});

module.exports = router;
