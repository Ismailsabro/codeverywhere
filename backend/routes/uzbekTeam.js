const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const requireTeamAccess = require('../middleware/requireTeamAccess');

const router = express.Router();
router.use(authMiddleware, requireTeamAccess);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const handlePhotoUpload = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo trop volumineuse (max 5MB)' : 'Erreur upload';
      return res.status(400).json({ error: message });
    }
    next();
  });
};

// GET /api/uzbek-team - metadata only, photo bytes are fetched separately
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, birth_date, start_date, salary, photo_type, created_at
       FROM uzbek_team_members ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/uzbek-team
router.post('/', handlePhotoUpload, async (req, res) => {
  const { name, birth_date, start_date, salary } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nom requis' });
  const photo = req.file;
  try {
    const result = await pool.query(
      `INSERT INTO uzbek_team_members (name, photo_data, photo_type, birth_date, start_date, salary)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, birth_date, start_date, salary, photo_type, created_at`,
      [name, photo ? photo.buffer : null, photo ? photo.mimetype : null, birth_date || null, start_date || null, salary || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/uzbek-team/:id
router.put('/:id', handlePhotoUpload, async (req, res) => {
  const { name, birth_date, start_date, salary } = req.body;
  const photo = req.file;
  try {
    const result = photo
      ? await pool.query(
          `UPDATE uzbek_team_members SET name=$1, birth_date=$2, start_date=$3, salary=$4, photo_data=$5, photo_type=$6
           WHERE id=$7 RETURNING id, name, birth_date, start_date, salary, photo_type, created_at`,
          [name, birth_date || null, start_date || null, salary || 0, photo.buffer, photo.mimetype, req.params.id]
        )
      : await pool.query(
          `UPDATE uzbek_team_members SET name=$1, birth_date=$2, start_date=$3, salary=$4
           WHERE id=$5 RETURNING id, name, birth_date, start_date, salary, photo_type, created_at`,
          [name, birth_date || null, start_date || null, salary || 0, req.params.id]
        );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/uzbek-team/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM uzbek_team_members WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/uzbek-team/:id/photo
router.get('/:id/photo', async (req, res) => {
  try {
    const result = await pool.query('SELECT photo_data, photo_type FROM uzbek_team_members WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0 || !result.rows[0].photo_data) {
      return res.status(404).json({ error: 'Photo introuvable' });
    }
    res.set('Content-Type', result.rows[0].photo_type || 'application/octet-stream');
    res.send(result.rows[0].photo_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
