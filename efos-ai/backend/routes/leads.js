const express = require('express');
const { body, query } = require('express-validator');
const leadController = require('../controllers/leadController');

const router = express.Router();

const leadValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('city').optional().trim(),
  body('qualification').optional().trim(),
  body('source').optional().isIn(['website', 'google_form', 'whatsapp', 'meta_ads', 'internship', 'referral']),
  body('course_interest').optional().trim(),
  body('status').optional().isIn(['New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected']),
  body('lead_score').optional().isInt({ min: 0, max: 100 }),
  body('website_visits').optional().isInt({ min: 0 }),
  body('brochure_downloaded').optional().isBoolean(),
  body('age').optional().isInt({ min: 0, max: 100 }),
];

const updateValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().trim().notEmpty(),
  body('city').optional().trim(),
  body('qualification').optional().trim(),
  body('source').optional().isIn(['website', 'google_form', 'whatsapp', 'meta_ads', 'internship', 'referral']),
  body('course_interest').optional().trim(),
  body('status').optional().isIn(['New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected']),
  body('lead_score').optional().isInt({ min: 0, max: 100 }),
  body('website_visits').optional().isInt({ min: 0 }),
  body('brochure_downloaded').optional().isBoolean(),
  body('age').optional().isInt({ min: 0, max: 100 }),
];

// POST /api/leads/webhook (must be before /:id to avoid matching 'webhook' as :id for POST)
router.post('/webhook', leadController.webhook);

// POST /api/leads
router.post('/', leadValidation, leadController.create);

// GET /api/leads
router.get('/', leadController.list);

// GET /api/leads/:id
router.get('/:id', leadController.getById);

// PUT /api/leads/:id
router.put('/:id', updateValidation, leadController.update);

// GET /api/leads/:id/score
router.get('/:id/score', leadController.getScore);

// POST /api/leads/:id/generate-message
router.post('/:id/generate-message', leadController.generateMessage);

// POST /api/leads/:id/assign-to-counselor
router.post('/:id/assign-to-counselor', leadController.assignToCounselor);

module.exports = router;
