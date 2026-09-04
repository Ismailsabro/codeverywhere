const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/messages
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at ASC LIMIT 200');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages
router.post('/', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message vide' });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, req.user.name, req.user.role, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
