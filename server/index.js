const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our allowed list
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o));
    
    // For unified deployment, if it's the same site, we allow it
    if (isAllowed || origin.includes('railway.app') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  }
}));
app.use(express.json());

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/bills',     require('./routes/bills'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'Billing API running' }));

// Serve Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../client/dist');
  console.log('📂 Serving static files from:', distPath);
  
  app.use(express.static(distPath));

  // Catch-all route to serve the frontend (but ONLY for non-API, non-asset requests)
  app.get(/^\/(?!api|assets|.*?\..*).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error('❌ Error sending index.html:', err.message);
        res.status(500).send('Frontend build folder missing or incorrect.');
      }
    });
  });
} else {
  // Local Dev Landing Page
  app.get('/', (req, res) => res.send('<h1>Billing API</h1><p>Visit the client dev server to view the UI.</p>'));
}

// Start Listening Immediately (Crucial for Railway)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Connect to MongoDB in background
  if (!process.env.MONGO_URI) {
    console.error('❌ FATAL: MONGO_URI is not defined in environment variables.');
  } else {
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected'))
      .catch(err => console.error('❌ MongoDB connection error:', err.message));
  }
});
