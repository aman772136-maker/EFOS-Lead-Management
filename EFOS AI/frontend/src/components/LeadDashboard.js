import React from 'react';
import LeadTable from './LeadTable';
import '../styles/LeadDashboard.css';

import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function LeadDashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('efos_user_email') || 'counselor@efos.ai';

  const handleLogout = () => {
    localStorage.removeItem('efos_authenticated');
    localStorage.removeItem('efos_user_email');
    navigate('/login');
  };

  return (
    <div className="lead-dashboard">
      <div className="dashboard-header-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="dashboard-logo">
            <Logo size="32px" />
          </div>
          <div>
            <h1>Lead Management Dashboard</h1>
            <p className="subtitle">View, filter, sort, and update lead statuses</p>
          </div>
        </div>
        <div className="user-profile-logout">
          <span className="user-email-badge">{userEmail}</span>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
      <LeadTable />
    </div>
  );
}

