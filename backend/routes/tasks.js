const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tasks - admins see every task, employees only see their own
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT tasks.*, employees.name AS employee_name
      FROM tasks
      LEFT JOIN employees ON tasks.employee_id = employees.id
    `;
    const params = [];
    if (req.user.role !== 'admin') {
      query += ' WHERE tasks.employee_id = $1';
      params.push(req.user.employeeId);
    }
    query += ' ORDER BY tasks.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/tasks
router.post('/', requireAdmin, async (req, res) => {
  const { title, description, employee_id, status, due_date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Titre requis' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, employee_id, status, due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, description || null, employee_id || null, status || 'pending', due_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, description, employee_id, status, due_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, employee_id=$3, status=$4, due_date=$5
       WHERE id=$6 RETURNING *`,
      [title, description || null, employee_id || null, status || 'pending', due_date || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
