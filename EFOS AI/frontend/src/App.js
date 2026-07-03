import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LeadForm from './components/LeadForm';
import LeadDashboard from './components/LeadDashboard';
import Login from './components/Login';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('efos_authenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (prevents access to login if already logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('efos_authenticated') === 'true';
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<LeadForm />} />
          <Route path="/dashboard" element={<ProtectedRoute><LeadDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

