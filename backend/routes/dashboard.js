const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
router.use(authMiddleware, requireAdmin);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      employeesTotal,
      employeesByStatus,
      tasksByStatus,
      tasksPerEmployee,
      messagesTotal,
      messagesToday,
      employeesSalary,
      teamSalary
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM employees'),
      pool.query('SELECT status, COUNT(*) FROM employees GROUP BY status'),
      pool.query('SELECT status, COUNT(*) FROM tasks GROUP BY status'),
      pool.query(`
        SELECT employees.id AS employee_id, employees.name, COUNT(tasks.id) AS count
        FROM employees
        LEFT JOIN tasks ON tasks.employee_id = employees.id
        GROUP BY employees.id, employees.name
        ORDER BY count DESC, employees.name ASC
      `),
      pool.query('SELECT COUNT(*) FROM messages'),
      pool.query('SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE'),
      pool.query('SELECT COALESCE(SUM(salary), 0) AS total FROM employees'),
      pool.query('SELECT COALESCE(SUM(salary), 0) AS total FROM uzbek_team_members')
    ]);

    const employeesPayroll = Number(employeesSalary.rows[0].total);
    const teamPayroll = Number(teamSalary.rows[0].total);

    res.json({
      employees: {
        total: Number(employeesTotal.rows[0].count),
        byStatus: employeesByStatus.rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {})
      },
      tasks: {
        total: tasksByStatus.rows.reduce((sum, r) => sum + Number(r.count), 0),
        byStatus: tasksByStatus.rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {}),
        perEmployee: tasksPerEmployee.rows.map(r => ({ employeeId: r.employee_id, name: r.name, count: Number(r.count) }))
      },
      messages: {
        total: Number(messagesTotal.rows[0].count),
        today: Number(messagesToday.rows[0].count)
      },
      payroll: {
        employees: employeesPayroll,
        team: teamPayroll,
        total: employeesPayroll + teamPayroll
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
