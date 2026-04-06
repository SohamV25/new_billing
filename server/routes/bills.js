const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');

// GET monthly analytics data
router.get('/analytics/monthly', async (req, res) => {
  try {
    const data = await Bill.aggregate([
      {
        $group: {
          _id: {
            year:  { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: { $toDouble: '$totalAfterTax' } },
          billCount:    { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET detailed analytics (Customer & Product level with Date Range)
router.get('/analytics/detailed', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    // Customer Revenue Aggregation
    const customerStats = await Bill.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$to",
          revenue: { $sum: { $toDouble: "$totalAfterTax" } },
          billCount: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 } // Top 10
    ]);

    // Product Sales Aggregation
    const productStats = await Bill.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      { $match: { "products.desc": { $ne: "" }, "products.qty": { $ne: "" } } },
      {
        $group: {
          _id: "$products.desc",
          unitsSold: { $sum: { $toDouble: "$products.qty" } },
          revenue: { 
            $sum: { 
              $multiply: [ { $toDouble: "$products.qty" }, { $toDouble: "$products.rate" } ] 
            } 
          }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 } // Top 10
    ]);

    res.json({ customerStats, productStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET next bill number
router.get('/next-number', async (req, res) => {
  try {
    const bills = await Bill.find({}, 'billNo');
    const maxNum = bills.reduce((max, b) => {
      const num = parseInt(b.billNo, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    res.json({ nextBillNo: maxNum + 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all bills (with optional search + date filter)
router.get('/', async (req, res) => {
  try {
    const { q, dateFrom, dateTo } = req.query;
    let filter = {};

    if (q) {
      // Search by either buyer name (regex) OR exact numeric billNo
      filter.$or = [
        { to: { $regex: q, $options: 'i' } }
      ];
      if (!isNaN(q)) {
        filter.$or.push({ billNo: q }); // Exact numeric string match
      }
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single bill by ID
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a new bill
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    
    // Auto-calculate billNo if completely missing or empty
    if (!payload.billNo || payload.billNo.trim() === '') {
      const bills = await Bill.find({}, 'billNo');
      const maxNum = bills.reduce((max, b) => {
        const num = parseInt(b.billNo, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      payload.billNo = String(maxNum + 1);
    }

    const bill = new Bill(payload);
    const saved = await bill.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a bill
router.delete('/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
