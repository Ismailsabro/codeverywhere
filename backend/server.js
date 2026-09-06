const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employees');
const messagesRoutes = require('./routes/messages');
const translateRoutes = require('./routes/translate');
const tasksRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.send('API codeverywhere en ligne ✅'));

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur initialisation DB:', err);
    process.exit(1);
  });
