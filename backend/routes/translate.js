const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const ALLOWED_TARGETS = ['en', 'ru', 'uz'];

// POST /api/translate
router.post('/', async (req, res) => {
  const { text, target } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Texte vide' });
  if (!ALLOWED_TARGETS.includes(target)) return res.status(400).json({ error: 'Langue cible invalide' });

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Traduction non configurée' });

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, format: 'text' })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      return res.status(502).json({ error: 'Erreur du service de traduction' });
    }
    res.json({ translatedText: data.data.translations[0].translatedText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
