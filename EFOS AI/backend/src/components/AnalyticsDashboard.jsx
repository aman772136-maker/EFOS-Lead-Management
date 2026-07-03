import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [sourcesData, setSourcesData] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, funnelResponse, sourcesResponse, activityResponse] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch('/api/analytics/conversion-funnel'),
        fetch('/api/analytics/lead-sources'),
        fetch('/api/analytics/recent-activity')
      ]);

      if (!summaryResponse.ok || !funnelResponse.ok || !sourcesResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [summaryData, funnelData, sourcesData, activityData] = await Promise.all([
        summaryResponse.json(),
        funnelResponse.json(),
        sourcesResponse.json(),
        activityResponse.json()
      ]);

      setSummary(summaryData.data);
      setFunnelData(funnelData.data);
      setSourcesData(sourcesData.data);
      setRecentActivity(activityData.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': '#6b7280',
      'Contacted': '#3b82f6',
      'Interested': '#10b981',
      'Qualified': '#8b5cf6',
      'Follow-Up': '#f59e0b',
      'Enrolled': '#10b981',
      'Rejected': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getSourceColor = (source) => {
    const colors = {
      'website': '#3b82f6',
      'google_form': '#10b981',
      'whatsapp': '#8b5cf6',
      'meta_ads': '#f59e0b',
      'internship': '#ef4444',
      'referral': '#06b6d4'
    };
    return colors[source] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">Error loading dashboard: {error}</div>
        <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Lead Analytics Dashboard</h1>
      
      <div className="summary-cards">
        <div className="card">
          <h3>Total Leads</h3>
          <div className="card-value">{summary?.totalLeads || 0}</div>
        </div>
        <div className="card">
          <h3>Hot Leads (>80 Score)</h3>
          <div className="card-value">{summary?.hotLeads || 0}</div>
        </div>
        <div className="card">
          <h3>Qualified Leads</h3>
          <div className="card-value">{summary?.qualifiedLeads || 0}</div>
        </div>
        <div className="card">
          <h3>Enrollments</h3>
          <div className="card-value">{summary?.enrollments || 0}</div>
        </div>
        <div className="card">
          <h3>Conversion Rate</h3>
          <div className="card-value">{summary?.conversionRate || 0}%</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Lead Source Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={summary?.leadSourcePerformance || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
              >
                {(summary?.leadSourcePerformance || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSourceColor(entry.source)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="conversion-percentage">
            <span>Conversion: {funnelData[funnelData.length - 1]?.percentage || 0}%</span>
          </div>
        </div>

        <div className="chart-card">
          <h3>Lead Sources Bar Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourcesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="source" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-tabs">
          <div className="activity-section">
            <h4>Recent Leads</h4>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentActivity?.recentLeads || []).map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.source}</td>
                    <td>{lead.lead_score}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(lead.status) }}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td>{formatDate(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="activity-section">
            <h4>Recent Counselor Assignments</h4>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Counselor</th>
                  <th>Assigned At</th>
                  <th>Notified</th>
                </tr>
              </thead>
              <tbody>
                {(recentActivity?.recentAssignments || []).map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.lead_name}</td>
                    <td>{assignment.counselor_name}</td>
                    <td>{formatDate(assignment.assigned_at)}</td>
                    <td>
                      <span className={`notified-badge ${assignment.notified ? 'notified' : 'pending'}`}>{
                        assignment.notified ? 'Notified' : 'Pending'
                      }</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
