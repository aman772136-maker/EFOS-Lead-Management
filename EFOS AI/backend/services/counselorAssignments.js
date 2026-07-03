const nodemailer = require('nodemailer');
const { generateMessage } = require('./messageGenerator');
const LeadModel = require('../models/leadModel');
const pool = require('../config/db');
require('dotenv').config();

const counselorAssignments = {
  async getCounselorForLead(lead) {
    const config = await this.getAssignmentConfig();
    const { assignmentMode, counselors } = config;

    if (assignmentMode === 'round-robin') {
      return this.getNextCounselor(roundRobin);
    } else if (assignmentMode === 'category-based') {
      const course = lead.course_interest || 'general';
      const category = await this.getCategoryForCourse(course);

      for (const counselor of counselors) {
        if (counselor.categories && counselor.categories.includes(category)) {
          return this.assignToCounselor(counselor.id, counselor.name);
        }
      }
    }

    return this.getNextCounselor(roundRobin);
  },

  async getCategoryForCourse(course) {
    const courseCategories = {
      programming: 'technical',
      data_science: 'technical',
      marketing: 'business',
      design: 'creative',
      business: 'business',
      general: 'general'
    };

    const normalized = course.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return courseCategories[normalized] || 'general';
  },

  async getNextCounselor(strategy) {
    const config = await this.getAssignmentConfig();
    const { counselors, roundRobin } = config;

    if (!counselors || counselors.length === 0) {
      return null;
    }

    const lastAssigned = roundRobin.lastAssigned || -1;
    let nextIndex = (lastAssigned + 1) % counselors.length;
    roundRobin.lastAssigned = nextIndex;

    const nextCounselor = counselors[nextIndex];
    await this.updateAssignmentConfig({ roundRobin });

    return this.assignToCounselor(nextCounselor.id, nextCounselor.name);
  },

  async assignToCounselor(counselorId, counselorName) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        'INSERT INTO counselor_assignments (lead_id, counselor_id, counselor_name, assigned_at, notified) VALUES (?, ?, ?, NOW(), ?)',
        [null, counselorId, counselorName, false]
      );

      await connection.commit();

      return {
        success: true,
        counselor_id: counselorId,
        assigned_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async markAsNotified(leadId) {
    await pool.query(
      'UPDATE counselor_assignments SET notified = ? WHERE lead_id = ?',
      [true, leadId]
    );
  },

  async getAssignmentConfig() {
    const [rows] = await pool.query('SELECT * FROM counselor_config LIMIT 1');
    return rows[0] || {
      assignmentMode: 'round-robin',
      counselors: [
        { id: 1, name: 'Alex Johnson', categories: ['technical', 'programming', 'data_science'] },
        { id: 2, name: 'Sarah Martinez', categories: ['business', 'marketing'] },
        { id: 3, name: 'Mike Chen', categories: ['creative', 'design'] }
      ],
      roundRobin: { lastAssigned: -1 }
    };
  },

  async updateAssignmentConfig(config) {
    await pool.query(
      'REPLACE INTO counselor_config (id, assignmentMode, counselors, roundRobin) VALUES (1, ?, ?, ?)',
      [config.assignmentMode, JSON.stringify(config.counselors), JSON.stringify(config.roundRobin || { lastAssigned: -1 })]
    );
  },

  async getAllCounselors() {
    const [rows] = await pool.query('SELECT * FROM counselors');
    return rows;
  },

  async assignWithNotification(leadId, counselorId, counselorName) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        'INSERT INTO counselor_assignments (lead_id, counselor_id, counselor_name, assigned_at, notified) VALUES (?, ?, ?, NOW(), ?)',
        [leadId, counselorId, counselorName, false]
      );

      const lead = await LeadModel.findById(leadId);

      await this.sendEmailNotification(counselorName, lead, leadId);

      await connection.commit();

      return {
        success: true,
        counselor_id: counselorId,
        notified: true,
        message: `Lead ${leadId} assigned to counselor ${counselorName}`
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async sendEmailNotification(counselorName, lead, leadId) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const counselorEmail = `counselor.${counselorId}@efos.ai`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'leads@efos.ai',
      to: counselorEmail,
      subject: `New Lead Assignment #${leadId}`,
      html: `
        <h2>New Lead Assigned</h2>
        <p><strong>Lead ID:</strong> ${leadId}</p>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Phone:</strong> ${lead.phone}</p>
        <p><strong>Course Interest:</strong> ${lead.course_interest || 'N/A'}</p>
        <p><strong>Lead Score:</strong> ${lead.lead_score}</p>
        <p><strong>Status:</strong> ${lead.status}</p>
        <p><strong>Assigned At:</strong> ${new Date().toISOString()}</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}">View Lead</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
  }
};

module.exports = counselorAssignments;
