const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

// A login is treated as an "employee" account when its email matches an
// HR employee record; otherwise it's an "admin" account with full access.
const resolveRole = async (email) => {
  const result = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    return { role: 'employee', employeeId: result.rows[0].id };
  }
  return { role: 'admin', employeeId: null };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashed]
    );
    const newUser = result.rows[0];
    const { role, employeeId } = await resolveRole(newUser.email);
    const token = jwt.sign({ id: newUser.id, name: newUser.name, role, employeeId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...newUser, role, employeeId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const { role, employeeId } = await resolveRole(user.email);
    const token = jwt.sign({ id: user.id, name: user.name, role, employeeId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role, employeeId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
