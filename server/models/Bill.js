const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  desc:     { type: String, default: '' },
  hsn:      { type: String, default: '' },
  qty:      { type: String, default: '' },
  rate:     { type: String, default: '' },
  cgst:     { type: String, default: '' },
  cgstAmt:  { type: String, default: '' },
  sgst:     { type: String, default: '' },
  sgstAmt:  { type: String, default: '' },
  igst:     { type: String, default: '' },
  igstAmt:  { type: String, default: '' },
}, { _id: false });

const BillSchema = new mongoose.Schema({
  to:             { type: String, required: true },
  toAddress:      { type: String, default: '' },
  gstNo:          { type: String, default: '' },
  billNo:         { type: String, default: '' },
  billDate:       { type: String, default: '' },
  orderNo:        { type: String, default: '' },
  orderDate:      { type: String, default: '' },
  dcNo:           { type: String, default: '' },
  dcDate:         { type: String, default: '' },
  extraReason:    { type: String, default: '' },
  extraCharges:   { type: String, default: '0' },
  amountInWords:  { type: String, default: '' },
  totalBeforeTax: { type: String, default: '0.00' },
  totalCGST:      { type: String, default: '0.00' },
  totalSGST:      { type: String, default: '0.00' },
  totalIGST:      { type: String, default: '0.00' },
  totalAfterTax:  { type: String, default: '0.00' },
  products:       [ProductSchema],
}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema);
