const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

// ======================
// ✅ CORS CONFIG
// ======================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(o => origin.startsWith(o));

    if (isAllowed || origin.includes('railway.app') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true
}));

app.use(express.json());

// ======================
// ✅ ROUTES
// ======================
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bills', require('./routes/bills'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Billing API running' });
});

// Root route (important for Railway)
app.get('/', (req, res) => {
  res.send('✅ Billing API is running');
});

// ======================
// ✅ STATIC (OPTIONAL)
// ======================
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../client/dist');

  app.use(express.static(distPath));

  app.get(/^\/(?!api|assets|.*?\..*).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ======================
// ✅ START SERVER (CRITICAL FIX HERE)
// ======================
const PORT = process.env.PORT || 5000;

// Start server FIRST (important for Railway)
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // ======================
  // ✅ CONNECT MONGO
  // ======================
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not defined');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
});
