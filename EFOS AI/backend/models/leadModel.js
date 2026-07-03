const pool = require('../config/db');

const LeadModel = {
  async create(leadData) {
    const [result] = await pool.query(
      `INSERT INTO leads (name, email, phone, city, qualification, source, course_interest, status, lead_score, score_category, website_visits, brochure_downloaded, age)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leadData.name,
        leadData.email,
        leadData.phone,
        leadData.city || null,
        leadData.qualification || null,
        leadData.source || 'website',
        leadData.course_interest || null,
        leadData.status || 'New',
        leadData.lead_score || 0,
        leadData.score_category || null,
        leadData.website_visits || 0,
        leadData.brochure_downloaded || false,
        leadData.age || null,
      ]
    );
    return this.findById(result.insertId);
  },

  async findAll({ page = 1, limit = 20, search, status, source, course, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (source) {
      conditions.push('source = ?');
      params.push(source);
    }
    if (course) {
      conditions.push('course_interest LIKE ?');
      params.push(`%${course}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const allowedSortColumns = ['lead_score', 'created_at', 'name', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `SELECT * FROM leads ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(dataQuery, [...params, parseInt(limit), parseInt(offset)]);

    return {
      leads: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async update(id, leadData) {
    const fields = [];
    const params = [];

    const allowedFields = ['name', 'email', 'phone', 'city', 'qualification', 'source', 'course_interest', 'status', 'lead_score', 'score_category', 'website_visits', 'brochure_downloaded', 'age', 'last_message', 'last_message_channel', 'last_message_at'];
    for (const field of allowedFields) {
      if (leadData[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(leadData[field]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM leads WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async upsertWithScore(leadData) {
    const lead = await this.findById(leadData.id);
    
    if (lead) {
      await this.update(leadData.id, leadData);
      return this.findById(leadData.id);
    } else {
      return this.create(leadData);
    }
  },
};

module.exports = LeadModel;
