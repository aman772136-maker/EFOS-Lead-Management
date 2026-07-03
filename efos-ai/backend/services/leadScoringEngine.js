const LeadModel = require('../models/leadModel');
const fs = require('fs');
const path = require('path');

const LeadScoringEngine = {
  _rulesCache: null,

  async scoreLead(lead) {
    const rules = await this.getScoringRules();
    let totalScore = 0;
    const breakdown = {};

    for (const rule of rules) {
      const { key, field, operator, value, weight, description } = rule;
      let satisfied = false;
      const leadValue = lead[field];

      switch (operator) {
        case 'equals':
          satisfied = leadValue === value;
          break;
        case 'notEquals':
          satisfied = leadValue !== value;
          break;
        case 'contains':
          satisfied = leadValue && String(leadValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'greaterThan':
          satisfied = typeof leadValue === 'number' && leadValue > value;
          break;
        case 'lessThan':
          satisfied = typeof leadValue === 'number' && leadValue < value;
          break;
        case 'range':
          satisfied = typeof leadValue === 'number' && leadValue >= value.min && leadValue <= value.max;
          break;
        case 'in':
          satisfied = Array.isArray(value) && value.includes(leadValue);
          break;
        case 'custom':
          satisfied = typeof value === 'function' ? value(lead) : false;
          break;
        default:
          satisfied = false;
      }

      const pointsEarned = satisfied ? weight : 0;
      totalScore += pointsEarned;

      breakdown[key] = {
        description,
        field,
        operator,
        expectedValue: value,
        actualValue: leadValue,
        weight,
        weight,
        pointsEarned,
        satisfied,
      };
    }

    const category = this.categorizeScore(totalScore);

    const scoredLead = {
      ...lead,
      lead_score: Math.min(Math.max(totalScore, 0), 100),
      score_category: category,
    };

    return { totalScore: scoredLead.lead_score, category, breakdown, lead: scoredLead };
  },

  async getScoringRules() {
    if (this._rulesCache) {
      return this._rulesCache;
    }

    const configPath = path.join(__dirname, '../config/scoringRules.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    this._rulesCache = config.rules || [];
    return this._rulesCache;
  },

  getCategories() {
    const configPath = path.join(__dirname, '../config/scoringRules.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.categories || { Cold: { min: 0, max: 40 }, Warm: { min: 41, max: 70 }, Hot: { min: 71, max: 100 } };
  },

  categorizeScore(score) {
    const categories = this.getCategories();
    if (score <= categories.Cold.max) return 'Cold';
    if (score <= categories.Warm.max) return 'Warm';
    return 'Hot';
  },

  async applyScoreToLead(leadData) {
    if (!leadData) return null;
    const scoringResult = await this.scoreLead(leadData);
    
    if (leadData.id) {
      await LeadModel.update(leadData.id, {
        lead_score: scoringResult.lead.lead_score,
        score_category: scoringResult.lead.score_category,
      });
    }
    
    return scoringResult.lead;
  },

  clearCache() {
    this._rulesCache = null;
  },
};

module.exports = LeadScoringEngine;
