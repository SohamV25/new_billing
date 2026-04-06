const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  city:    { type: String, default: '' },
  gst:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
