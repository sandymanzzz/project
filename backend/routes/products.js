const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

/* GET /api/products */
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;
    let query = {};
    if (category && category !== 'all') query.category = category;
    let products = await Product.find(query).sort({ createdAt: -1 });
    if (limit) products = products.slice(0, parseInt(limit));
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* GET /api/products/:id */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

/* POST /api/products — Admin only */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, description, category, image, modelFile } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required.' });
    const product = await Product.create({ name, price, description, category, image, modelFile });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* PUT /api/products/:id — Admin only */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, price, description, category, image, modelFile } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, category, image, modelFile },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* DELETE /api/products/:id — Admin only */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
