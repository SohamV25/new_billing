const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET all customers (or search by name)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    const customers = await Customer.find(filter).sort({ name: 1 }).limit(20);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upsert customer (create or update by name)
router.post('/upsert', async (req, res) => {
  try {
    const { name, address, city, gst } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    let customer = await Customer.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (customer) {
      if (address) customer.address = address;
      if (city) customer.city = city;
      if (gst) customer.gst = gst;
      await customer.save();
    } else {
      customer = new Customer({ name, address, city, gst });
      await customer.save();
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update explicit customer by ID
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
