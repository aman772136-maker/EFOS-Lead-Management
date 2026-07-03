const express = require('express');
const { body } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', analyticsController.getSummary);

// GET /api/analytics/conversion-funnel
router.get('/conversion-funnel', analyticsController.getConversionFunnel);

// GET /api/analytics/lead-sources
router.get('/lead-sources', analyticsController.getLeadSources);

// GET /api/analytics/recent-activity
router.get('/recent-activity', analyticsController.getRecentActivity);

module.exports = router;
