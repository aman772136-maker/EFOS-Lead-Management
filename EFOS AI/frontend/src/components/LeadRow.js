import React, { useState } from 'react';
import { updateLead } from '../services/api';
import StatusBadge from './StatusBadge';

const STATUSES = ['New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected'];

export default function LeadRow({ lead, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === lead.status) return;
    setUpdating(true);
    try {
      await updateLead(lead.id, { status: newStatus });
      onStatusUpdate(lead.id, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <tr className={updating ? 'lead-row-updating' : ''}>
      <td className="cell-name">{lead.name}</td>
      <td>
        <StatusBadge status={lead.status} />
      </td>
      <td>{lead.course_interest || '-'}</td>
      <td className="cell-score">
        <span className={`score-value ${lead.lead_score >= 70 ? 'high' : lead.lead_score >= 40 ? 'mid' : 'low'}`}>
          {lead.lead_score ?? '-'}
        </span>
      </td>
      <td className="cell-source">{lead.source || '-'}</td>
      <td className="cell-date">{formatDate(lead.created_at)}</td>
      <td className="cell-action">
        <select
          value={lead.status}
          onChange={handleStatusChange}
          disabled={updating}
          className="status-select"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}
