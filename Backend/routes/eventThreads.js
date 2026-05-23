const express = require('express');
const { all, get, run } = require('../db');
const { requireSession } = require('../middleware/sessionAuth');

const router = express.Router();
function normalizeItem(row) {
  return {
    id: row.id,
    author: row.authorName,
    text: row.text,
    createdAt: row.createdAt
  };
}

// Get thread for an event
router.get('/:id', (req, res) => {
  (async () => {
    try {
      const eventId = Number(req.params.id);
      if (!Number.isFinite(eventId)) return res.status(400).json({ message: 'Invalid event id.' });

      const items = await all(
        `SELECT id,
                author_name AS "authorName",
                text,
                created_at AS "createdAt"
         FROM event_discussion_messages
         WHERE event_id = ?
         ORDER BY created_at DESC`,
        [eventId]
      );

      return res.json({ items: items.map(normalizeItem) });
    } catch (err) {
      console.error('Get thread error', err);
      return res.status(500).json({ message: 'Could not fetch thread.' });
    }
  })();
});

// Post message to event thread
router.post('/:id', requireSession, (req, res) => {
  (async () => {
    try {
      const eventId = Number(req.params.id);
      const text = String(req.body.text || '').trim();
      if (!Number.isFinite(eventId)) return res.status(400).json({ message: 'Invalid event id.' });
      if (!text) return res.status(400).json({ message: 'Message required.' });

      const event = await get(`SELECT id FROM events WHERE id = ?`, [eventId]);
      if (!event) return res.status(404).json({ message: 'Event not found.' });

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
        `INSERT INTO event_discussion_messages (event_id, user_id, author_name, text, created_at)
         VALUES (?, ?, ?, ?, ?)
         RETURNING id`,
        [eventId, req.sessionUser.userId, authorName, text, createdAt]
      );

      return res.status(201).json({
        item: {
          id: result.lastID,
          author: authorName,
          text,
          createdAt
        }
      });
    } catch (err) {
      console.error('Post thread error', err);
      return res.status(500).json({ message: 'Could not post message.' });
    }
  })();
});

module.exports = router;
