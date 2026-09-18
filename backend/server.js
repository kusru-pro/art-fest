const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const judgeRoutes = require('./routes/judgeRoutes');
const councilRoutes = require('./routes/councilRoutes');
const publicRoutes = require('./routes/publicRoutes');
const participantRoutes = require('./routes/participantRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sahityotsav';

// === Middleware ===
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === API Route Mounts ===
app.use('/api/judge', judgeRoutes);
app.use('/api/council', councilRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/participant', participantRoutes);

// === Health Check Endpoint ===
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Sahityotsav Art Fest Central API'
  });
});

// === Global 404 Handler for API ===
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// === Connect to MongoDB & Start Server ===
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Sahityotsav Server running on http://localhost:${PORT}`);
      console.log(`📡 Judge API:       http://localhost:${PORT}/api/judge/submit`);
      console.log(`🏛️ Council API:     http://localhost:${PORT}/api/council/pending`);
      console.log(`🌐 Public API:      http://localhost:${PORT}/api/public/results`);
      console.log(`👤 Participant API: http://localhost:${PORT}/api/participant/login`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.log('⚠️ Please ensure your MongoDB instance is running, or set MONGODB_URI in backend/.env');
  });

module.exports = app;
