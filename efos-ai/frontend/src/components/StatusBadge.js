import React from 'react';

const STATUS_COLORS = {
  'New': '#6b7280',
  'Contacted': '#3b82f6',
  'Interested': '#8b5cf6',
  'Follow-Up': '#f59e0b',
  'Qualified': '#10b981',
  'Hot': '#10b981',
  'Enrolled': '#059669',
  'Rejected': '#ef4444',
};

const STATUS_BG = {
  'New': '#1f2937',
  'Contacted': '#1e3a5f',
  'Interested': '#2e1a47',
  'Follow-Up': '#451a03',
  'Qualified': '#064e3b',
  'Hot': '#064e3b',
  'Enrolled': '#022c22',
  'Rejected': '#450a0a',
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const bg = STATUS_BG[status] || '#1f2937';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${color}33`,
      }}
    >
      {status}
    </span>
  );
}
