require('dotenv').config();
const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leads');
const LeadScoringEngine = require('./services/leadScoringEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
app.use(express.json());

// Middleware to auto-score leads after successful lead creation/update
app.use('/api/leads', async (req, res, next) => {
  const isCreate = req.path === '/' && req.method === 'POST';
  const isUpdate = req.path.match(/^\/[^\/]+$/) && req.method === 'PUT';
  
  if (isCreate || isUpdate) {
    const originalJson = res.json;
    res.json = async function(data) {
      if (data && data.success && data.data && data.data.id) {
        try {
          const scoredLead = await LeadScoringEngine.applyScoreToLead(data.data);
          data.data = scoredLead;
        } catch (err) {
          console.error('Lead scoring error:', err);
        }
      }
      originalJson.call(this, data);
    };
  }
  next();
});

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/analytics', require('./routes/analytics'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Recompute/return score for a lead with full breakdown
app.get('/api/leads/:id/score', async (req, res) => {
  try {
    const LeadModel = require('./models/leadModel');
    const lead = await LeadModel.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const scoringResult = await LeadScoringEngine.scoreLead(lead);
    res.json({ 
      success: true, 
      data: { 
        lead: scoringResult.lead,
        scoring: {
          totalScore: scoringResult.totalScore,
          category: scoringResult.category,
          breakdown: scoringResult.breakdown,
        }
      } 
    });
  } catch (err) {
    console.error('Score computation error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'EFOS Leads API',
    version: '1.0.0',
    description: 'EFOS AI-Powered Lead Qualification API',
    endpoints: {
      'GET /api/health': 'Health check',
      'GET /api/leads': 'List all leads',
      'POST /api/leads': 'Create a new lead',
      'GET /api/leads/:id': 'Get lead by ID',
      'PUT /api/leads/:id': 'Update lead',
      'GET /api/leads/:id/score': 'Get lead score',
      'POST /api/leads/webhook': 'Webhook to create lead from external source',
      'GET /api/analytics': 'Get analytics data'
    }
  });
});

// Debug endpoint to check SQLite database state
app.get('/api/debug', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [leadsCount] = await pool.query('SELECT COUNT(*) as count FROM leads');
    const [counselorsCount] = await pool.query('SELECT COUNT(*) as count FROM counselors');
    const [tables] = await pool.query("SELECT name FROM sqlite_master WHERE type='table'");
    res.json({
      success: true,
      tables: tables.map(t => t.name),
      leadsCount: leadsCount[0].count,
      counselorsCount: counselorsCount[0].count
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`EFOS Leads API running on port ${PORT}`);
});

module.exports = app;
