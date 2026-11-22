// backend/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const bookRoutes     = require('./routes/bookRoutes');
const authorRoutes   = require('./routes/authorRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const reportRoutes   = require('./routes/reportRoutes');
const dashRoutes     = require('./routes/dashboardRoutes');
const errorHandler   = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/books',      bookRoutes);
app.use('/api/authors',    authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/dashboard',  dashRoutes);

// ── Catch-all: serve frontend SPA ───────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Centralized Error Handler ────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📚 Shelf & Co. server running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});

