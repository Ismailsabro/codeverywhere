const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/messages - metadata only, file bytes are fetched separately per message
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, sender_id, sender_name, sender_role, content, file_name, file_type, file_size, created_at
       FROM messages ORDER BY created_at ASC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages - text and/or a single file attachment
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (max 5MB)' : 'Erreur upload';
      return res.status(400).json({ error: message });
    }
    next();
  });
}, async (req, res) => {
  const { content } = req.body;
  const file = req.file;
  if ((!content || !content.trim()) && !file) return res.status(400).json({ error: 'Message vide' });
  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, content, file_data, file_name, file_type, file_size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, sender_id, sender_name, sender_role, content, file_name, file_type, file_size, created_at`,
      [
        req.user.id, req.user.name, req.user.role, content || null,
        file ? file.buffer : null, file ? file.originalname : null, file ? file.mimetype : null, file ? file.size : null
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages/:id/file - serve the attachment bytes
router.get('/:id/file', async (req, res) => {
  try {
    const result = await pool.query('SELECT file_data, file_name, file_type FROM messages WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0 || !result.rows[0].file_data) {
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    const { file_data, file_name, file_type } = result.rows[0];
    res.set('Content-Type', file_type || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file_name || 'file')}"`);
    res.send(file_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
