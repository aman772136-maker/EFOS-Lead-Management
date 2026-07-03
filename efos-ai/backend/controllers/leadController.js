const { validationResult } = require('express-validator');
const { generateMessage } = require('../services/messageGenerator');
const LeadModel = require('../models/leadModel');
const counselorAssignments = require('../services/counselorAssignments');
require('dotenv').config();

const leadController = {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const lead = await LeadModel.create(req.body);

      // Trigger n8n webhook if configured
      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) {
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'lead.created', lead }),
        }).catch(() => {});
      }

      // Trigger Module 6 (Counselor Assignment) webhook if configured
      if (lead.lead_score > 80) {
        const n8nModule6Url = process.env.N8N_MODULE6_WEBHOOK_URL;
        if (n8nModule6Url) {
          fetch(n8nModule6Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'lead.qualified', lead }),
          }).catch(() => {});
        }
      }

      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      console.error('Create lead error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Duplicate entry detected.' });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async list(req, res) {
    try {
      const { page, limit, search, status, source, course, sortBy, sortOrder } = req.query;
      const result = await LeadModel.findAll({ page, limit, search, status, source, course, sortBy, sortOrder });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('List leads error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, data: lead });
    } catch (err) {
      console.error('Get lead error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existing = await LeadModel.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const lead = await LeadModel.update(req.params.id, req.body);
      res.json({ success: true, data: lead });
    } catch (err) {
      console.error('Update lead error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async webhook(req, res) {
    try {
      const payload = req.body;
      const normalized = {
        name: payload.name || payload.Name || payload.full_name || payload.fullName,
        email: payload.email || payload.Email || payload.email_address,
        phone: payload.phone || payload.Phone || payload.phone_number || payload.mobile,
        city: payload.city || payload.City,
        qualification: payload.qualification || payload.Qualification || payload.education,
        source: payload.source || payload.Source || 'website',
        course_interest: payload.course_interest || payload.Course_Interest || payload.course || payload.Course,
        status: 'New',
        lead_score: 0,
        website_visits: payload.website_visits || 0,
        brochure_downloaded: payload.brochure_downloaded || false,
        age: payload.age || null,
      };

      if (!normalized.name || !normalized.email || !normalized.phone) {
        return res.status(400).json({ success: false, message: 'Missing required fields: name, email, phone' });
      }

      const lead = await LeadModel.create(normalized);

      const n8nUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nUrl) {
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'lead.created', lead }),
        }).catch(() => {});
      }

      const n8nModule6Url = process.env.N8N_MODULE6_WEBHOOK_URL;
      if (n8nModule6Url) {
        fetch(n8nModule6Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'lead.qualified', lead }),
        }).catch(() => {});
      }

      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getScore(req, res) {
    try {
      const LeadModel = require('../models/leadModel');
      const LeadScoringEngine = require('../services/leadScoringEngine');
      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      const scoringResult = await LeadScoringEngine.scoreLead(lead);
      res.json({ success: true, data: { lead, scoring: scoringResult } });
    } catch (err) {
      console.error('Score computation error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async generateMessage(req, res) {
    try {
      const { channel } = req.body;
      const validChannels = ['whatsapp', 'email', 'sms'];
      
      if (!channel || !validChannels.includes(channel)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid channel. Must be one of: ${validChannels.join(', ')}` 
        });
      }

      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }

      if (lead.last_message && lead.last_message_channel === channel) {
        return res.json({ 
          success: true, 
          data: { 
            message: lead.last_message,
            channel: lead.last_message_channel,
            cached: true,
            generated_at: lead.last_message_at,
          } 
        });
      }

      const message = await generateMessage(lead, channel);

      await LeadModel.update(req.params.id, {
        last_message: message,
        last_message_channel: channel,
        last_message_at: new Date(),
      });

      res.json({ 
        success: true, 
        data: { 
          message,
          channel,
          cached: false,
          generated_at: new Date(),
        } 
      });
    } catch (err) {
      console.error('Generate message error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async assignToCounselor(req, res) {
    try {
      const leadId = req.params.id;
      const { counselor_id } = req.body;
      const counselors = await counselorAssignments.getAllCounselors().catch(() => []);
      const counselor = counselors.find(c => c.id === parseInt(counselor_id, 10)) || { name: 'Unknown Counselor' };
      const counselorName = counselor.name;

      const result = await counselorAssignments.assignWithNotification(leadId, counselor_id, counselorName);

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Assign to counselor error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async seed(req, res) {
    try {
      const courses = ['B.Tech (CS)', 'B.Tech (AI/ML)', 'MCA', 'M.Tech', 'BCA', 'B.Sc IT', 'BTech'];
      const sources = ['WhatsApp Campaign', 'LinkedIn', 'Website Direct', 'Instagram Ad', 'Referral', 'Telegram'];
      const statuses = ['Contacted', 'Qualified', 'Rejected', 'Enrolled', 'Pending Review'];
      const firstNames = ['Aman', 'Rohit', 'Priya', 'Sneha', 'Rahul', 'Ananya', 'Vikas', 'Kiran', 'Deepak', 'Pooja', 'Aditya', 'Neha'];
      const lastNames = ['Kumar', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Patel', 'Yadav', 'Mishra', 'Joshi', 'Mehta'];
      const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];
      const qualifications = ['12th Completed', 'Graduate', 'Undergraduate', 'Post Graduate'];

      const batch = [];
      for (let i = 1; i <= 1000; i++) {
        const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${fname} ${lname}`;
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${Math.floor(10 + Math.random() * 90)}@gmail.com`;
        const course = courses[Math.floor(Math.random() * courses.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const phone = `+91 ${Math.floor(60000 + Math.random() * 40000)} ${Math.floor(10000 + Math.random() * 90000)}`;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
        const age = Math.floor(16 + Math.random() * 10);
        const website_visits = Math.floor(Math.random() * 6);
        const brochure_downloaded = Math.random() > 0.5 ? 1 : 0;

        // Calculate Lead Score
        let score = 0;
        if (qualification === '12th Completed') score += 20;
        if (age >= 16 && age <= 18) score += 25;
        if (course === 'BTech') score += 20;
        if (brochure_downloaded === 1) score += 15;
        if (website_visits > 3) score += 20;
        
        score = Math.min(Math.max(score, 0), 100);
        let category = 'Cold';
        if (score > 40 && score <= 70) category = 'Warm';
        else if (score > 70) category = 'Hot';

        batch.push({
          name, email, phone, city, qualification, source, course_interest: course, status,
          lead_score: score, score_category: category, website_visits, brochure_downloaded, age
        });
      }

      const pool = require('../config/db');
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        for (const lead of batch) {
          await connection.query(
            `INSERT INTO leads (name, email, phone, city, qualification, source, course_interest, status, lead_score, score_category, website_visits, brochure_downloaded, age)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              lead.name, lead.email, lead.phone, lead.city, lead.qualification, lead.source, lead.course_interest, lead.status,
              lead.lead_score, lead.score_category, lead.website_visits, lead.brochure_downloaded, lead.age
            ]
          );
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      }

      res.json({ success: true, message: 'Successfully seeded 1,000 leads with scores!' });
    } catch (err) {
      console.error('Seeding error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during seeding.' });
    }
  },
};

module.exports = leadController;

