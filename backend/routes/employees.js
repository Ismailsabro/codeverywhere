const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.use(authMiddleware, requireAdmin);

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/employees
router.post('/', async (req, res) => {
  const { name, email, phone, position, department, salary, status, hire_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO employees (name, email, phone, position, department, salary, status, hire_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email, phone, position, department, salary || 0, status || 'active', hire_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  const { name, email, phone, position, department, salary, status, hire_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employees SET name=$1, email=$2, phone=$3, position=$4, department=$5, salary=$6, status=$7, hire_date=$8
       WHERE id=$9 RETURNING *`,
      [name, email, phone, position, department, salary || 0, status || 'active', hire_date || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employé introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
