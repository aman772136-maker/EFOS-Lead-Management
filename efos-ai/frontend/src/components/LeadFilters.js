import React from 'react';

const STATUSES = ['', 'New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected'];
const SOURCES = ['', 'website', 'google_form', 'whatsapp', 'meta_ads', 'internship', 'referral'];
const COURSES = ['', 'BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA', 'BBA', 'BA', 'Other'];

export default function LeadFilters({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });

  return (
    <div className="lead-filters">
      <div className="filter-group filter-search">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={filters.search}
          onChange={handle('search')}
        />
      </div>
      <div className="filter-group">
        <select value={filters.status} onChange={handle('status')}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select value={filters.source} onChange={handle('source')}>
          <option value="">All Sources</option>
          {SOURCES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <select value={filters.course} onChange={handle('course')}>
          <option value="">All Courses</option>
          {COURSES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
