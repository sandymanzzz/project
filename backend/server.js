require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');

const app = express();

/* ── MIDDLEWARE ── */
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── SERVE STATIC FILES ── */
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

/* ── API ROUTES ── */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

/* ── SPA FALLBACK ── */
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/* ── DATABASE & START ── */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/forge3d';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdminIfNeeded();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('DB connection error:', err); process.exit(1); });

/* ── SEED ADMIN ── */
async function seedAdminIfNeeded() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@forge3d.com',
      password: hashed,
      role: 'admin'
    });
    console.log(`Admin created: ${process.env.ADMIN_EMAIL || 'admin@forge3d.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  }
}
