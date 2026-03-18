const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  items: [{
    _id: { type: String },
    name: { type: String },
    price: { type: Number },
    image: { type: String }
  }],
  total: { type: Number, required: true },
  paymentId: { type: String },
  orderId: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
