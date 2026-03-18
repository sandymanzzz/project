const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

/* POST /api/orders/create-payment */
router.post('/create-payment', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount required.' });

    const rzpKey = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKey || !rzpSecret || rzpKey === 'rzp_test_YOUR_KEY_HERE') {
      return res.json({
        key: rzpKey || 'rzp_test_demo',
        amount,
        orderId: 'demo_order_' + Date.now(),
        demo: true
      });
    }

    const razorpay = new Razorpay({ key_id: rzpKey, key_secret: rzpSecret });
    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt: 'rcpt_' + Date.now() });
    res.json({ key: rzpKey, amount: order.amount, orderId: order.id });
  } catch (err) {
    res.status(500).json({ message: 'Payment initialization failed.', error: err.message });
  }
});

/* POST /api/orders */
router.post('/', protect, async (req, res) => {
  try {
    const { items, total, name, email, phone, address, paymentId, orderId } = req.body;
    if (!items || !total || !name || !email) return res.status(400).json({ message: 'Missing required fields.' });
    const order = await Order.create({
      user: req.user._id, items, total, name, email, phone, address, paymentId, orderId, status: 'pending'
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* GET /api/orders/my — User's own orders */
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

/* GET /api/orders — Admin all orders */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

/* PUT /api/orders/:id/status — Admin */
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
