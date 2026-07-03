import React, { useState, useEffect, useCallback } from 'react';
import { getLeads } from '../services/api';
import LeadFilters from './LeadFilters';
import LeadRow from './LeadRow';

const SORT_COLUMNS = [
  { key: 'lead_score', label: 'Lead Score' },
  { key: 'created_at', label: 'Created Date' },
];

export default function LeadTable() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    course: '',
    page: 1,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.course) params.course = filters.course;
      if (filters.page) params.page = filters.page;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      const result = await getLeads(params);
      setLeads(result.leads || []);
      if (result.pagination) setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusUpdate = (id, newStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
  };

  const handleSort = (column) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC',
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const SortIcon = ({ column }) => {
    if (filters.sortBy !== column) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{filters.sortOrder === 'ASC' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="lead-table-container">
      <LeadFilters filters={filters} onChange={setFilters} />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Course</th>
              <th className="sortable" onClick={() => handleSort('lead_score')}>
                Score <SortIcon column="lead_score" />
              </th>
              <th>Source</th>
              <th className="sortable" onClick={() => handleSort('created_at')}>
                Created <SortIcon column="created_at" />
              </th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-message">Loading leads...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-message">No leads found.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} onStatusUpdate={handleStatusUpdate} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
