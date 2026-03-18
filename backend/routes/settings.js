const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

/* GET /api/settings/title */
router.get('/title', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: 'site_title' });
    res.json({ title: setting ? setting.value : 'FORGE3D' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

/* POST /api/settings/title — Admin only */
router.post('/title', protect, adminOnly, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required.' });
    await Settings.findOneAndUpdate({ key: 'site_title' }, { key: 'site_title', value: title }, { upsert: true, new: true });
    res.json({ message: 'Title updated.', title });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
