const express = require('express');
const bcrypt = require('bcryptjs');
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
  const { name, email, phone, position, department, salary, status, hire_date, can_manage_uzbek_team } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employees SET name=$1, email=$2, phone=$3, position=$4, department=$5, salary=$6, status=$7, hire_date=$8, can_manage_uzbek_team=$9
       WHERE id=$10 RETURNING *`,
      [name, email, phone, position, department, salary || 0, status || 'active', hire_date || null, !!can_manage_uzbek_team, req.params.id]
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

// POST /api/employees/:id/access - create or reset this employee's app login
router.post('/:id/access', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }
  try {
    const empResult = await pool.query('SELECT * FROM employees WHERE id=$1', [req.params.id]);
    if (empResult.rows.length === 0) return res.status(404).json({ error: 'Employé introuvable' });
    const employee = empResult.rows[0];
    if (!employee.email) return res.status(400).json({ error: "Cet employé n'a pas d'email" });

    const hashed = await bcrypt.hash(password, 10);
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [employee.email]);
    if (existing.rows.length > 0) {
      await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, existing.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1,$2,$3)',
        [employee.name, employee.email, hashed]
      );
    }
    res.json({ success: true, email: employee.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
