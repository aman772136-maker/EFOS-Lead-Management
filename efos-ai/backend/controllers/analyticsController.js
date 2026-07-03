const { validationResult } = require('express-validator');
const { body, query } = require('express-validator');
const pool = require('../config/db');
require('dotenv').config();

const analyticsController = {
  async getSummary(req, res) {
    try {
      const [totalLeads] = await pool.query('SELECT COUNT(*) as count FROM leads');
      const [hotLeads] = await pool.query("SELECT COUNT(*) as count FROM leads WHERE lead_score > 80");
      const [interestedLeads] = await pool.query("SELECT COUNT(*) as count FROM leads WHERE status = 'Interested'");
      const [enrolledLeads] = await pool.query("SELECT COUNT(*) as count FROM leads WHERE status = 'Enrolled'");
      const [convertedRate] = await pool.query(
        'SELECT (1.0 * (SELECT COUNT(*) FROM leads WHERE status = \'Enrolled\') / NULLIF(COUNT(*), 0)) as rate FROM leads'
      );

      const [sourceData] = await pool.query(
        'SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC'
      );

      const summary = {
        totalLeads: totalLeads[0].count,
        hotLeads: hotLeads[0].count,
        qualifiedLeads: interestedLeads[0].count,
        enrollments: enrolledLeads[0].count,
        conversionRate: parseFloat((convertedRate[0].rate * 100) || 0).toFixed(2),
        leadSourcePerformance: sourceData.map(item => ({
          source: item.source || 'Unknown',
          count: item.count
        }))
      };

      res.json({ success: true, data: summary });
    } catch (err) {
      console.error('Analytics summary error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getConversionFunnel(req, res) {
    try {
      const stages = ['New', 'Contacted', 'Interested', 'Qualified', 'Follow-Up', 'Enrolled'];
      const funnel = [];

      for (const stage of stages) {
        const [count] = await pool.query('SELECT COUNT(*) as count FROM leads WHERE status = ?', [stage]);
        const previousStageCount = funnel[funnel.length - 1]?.count || (stage === 'New' ? count[0].count : 0);
        
        funnel.push({
          stage,
          count: count[0].count,
          percentage: stage === 'New' ? 100 : (
            previousStageCount > 0 ? (count[0].count / previousStageCount * 100).toFixed(2) : 0
          )
        });
      }

      res.json({ success: true, data: funnel });
    } catch (err) {
      console.error('Conversion funnel error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getLeadSources(req, res) {
    try {
      const [sourceData] = await pool.query(
        'SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC'
      );

      res.json({ success: true, data: sourceData });
    } catch (err) {
      console.error('Lead sources error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getRecentActivity(req, res) {
    try {
      const [recentLeads] = await pool.query(
        'SELECT id, name, email, source, created_at, lead_score, status FROM leads ORDER BY created_at DESC LIMIT 20'
      );

      const [recentAssignments] = await pool.query(
        'SELECT c.id, l.name as lead_name, c.counselor_name, c.assigned_at FROM counselor_assignments c JOIN leads l ON c.lead_id = l.id ORDER BY c.assigned_at DESC LIMIT 10'
      );

      res.json({ 
        success: true, 
        data: { 
          recentLeads, 
          recentAssignments 
        } 
      });
    } catch (err) {
      console.error('Recent activity error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = analyticsController;
