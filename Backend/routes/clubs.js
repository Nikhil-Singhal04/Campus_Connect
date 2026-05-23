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
  return raw || '';
}

function normalizeReturnedClub(row) {
  if (!row) return row;
  const id = normalizeClubId(row.id);
  const canonicalId = id === 'entre' ? 'entrepreneurship' : id === 'culture' ? 'cultural' : id;

  return {
    id: canonicalId,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt
  };
}

router.get('/', (req, res) => {
  (async () => {
    try {
      const clubs = await all(
        `SELECT id,
                name,
                description AS "desc",
                created_at AS "createdAt"
         FROM clubs
         ORDER BY name ASC`
      );

      const uniqueClubs = [];
      const seenIds = new Set();
      for (const club of clubs) {
        const normalized = normalizeReturnedClub({
          id: club.id,
          name: club.name,
          description: club.desc,
          createdAt: club.createdAt
        });
        if (!normalized || seenIds.has(normalized.id)) continue;
        seenIds.add(normalized.id);
        uniqueClubs.push(normalized);
      }

      return res.json({ clubs: uniqueClubs });
    } catch (err) {
      console.error('List clubs error', err);
      return res.status(500).json({ message: 'Could not fetch clubs.' });
    }
  })();
});

router.get('/joined', requireSession, (req, res) => {
  (async () => {
    try {
      const clubs = await all(
        `SELECT c.id,
                c.name,
                c.description,
                c.created_at AS "createdAt"
         FROM club_memberships m
         JOIN clubs c ON c.id = m.club_id
         WHERE m.user_id = ?
         ORDER BY c.name ASC`,
        [req.sessionUser.userId]
      );

      const uniqueClubs = [];
      const seenIds = new Set();
      for (const club of clubs) {
        const normalized = normalizeReturnedClub(club);
        if (!normalized || seenIds.has(normalized.id)) continue;
        seenIds.add(normalized.id);
        uniqueClubs.push(normalized);
      }

      return res.json({ clubs: uniqueClubs });
    } catch (err) {
      console.error('List joined clubs error', err);
      return res.status(500).json({ message: 'Could not fetch joined clubs.' });
    }
  })();
});

router.post('/:id/join', requireSession, (req, res) => {
  (async () => {
    try {
      const requestedClubId = normalizeClubId(req.params.id);
      const clubId = requestedClubId === 'entrepreneurship'
        ? 'entrepreneurship'
        : requestedClubId === 'cultural'
          ? 'cultural'
          : requestedClubId;
      if (!clubId) return res.status(400).json({ message: 'Invalid club id.' });

      const legacyAlias = CLUB_ALIASES[clubId] || '';
      const club = await get(
        `SELECT id FROM clubs WHERE id = ? OR id = ?`,
        [clubId, legacyAlias || clubId]
      );
      if (!club) return res.status(404).json({ message: 'Club not found.' });

      const user = await get(
        `SELECT id, username, first_name AS "firstName", last_name AS "lastName"
         FROM users
         WHERE id = ?`,
        [req.sessionUser.userId]
      );

      if (!user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      await run(
        `INSERT INTO club_memberships (club_id, user_id, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT (club_id, user_id) DO NOTHING`,
        [club.id, req.sessionUser.userId, Date.now()]
      );

      return res.json({ joined: true, clubId: normalizeReturnedClub({ id: club.id }).id, user: req.sessionUser.userId });
    } catch (err) {
      console.error('Join club error', err);
      return res.status(500).json({ message: 'Could not join club.' });
    }
  })();
});

module.exports = router;
