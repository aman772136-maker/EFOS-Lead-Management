import React, { useState } from 'react';
import { createLead } from '../services/api';
import '../styles/LeadForm.css';
import Logo from './Logo';

const INITIAL = { name: '', email: '', phone: '', city: '', qualification: '', course_interest: '' };

const COURSES = [
  'BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA', 'BBA', 'BA', 'Other',
];

function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email format';
  if (!data.phone.trim()) errors.phone = 'Phone is required';
  else if (!/^[\d\s+\-()]{7,15}$/.test(data.phone)) errors.phone = 'Invalid phone number';
  if (!data.city.trim()) errors.city = 'City is required';
  if (!data.course_interest.trim()) errors.course_interest = 'Course interest is required';
  return errors;
}

export default function LeadForm() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    setSuccess(null);
    try {
      await createLead({ ...form, source: 'website' });
      setSuccess('Thank you! Your registration has been submitted successfully.');
      setForm(INITIAL);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lead-form-container">
      <div className="lead-form-card">
        <div className="lead-form-header">
          <div className="form-logo">
            <Logo size="40px" />
          </div>
          <h1>EFOS</h1>
          <p>AI-Powered Student Registration</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {errors.form && <div className="alert alert-error">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={handleChange}
                className={errors.city ? 'input-error' : ''}
              />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="qualification">Highest Qualification</label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                placeholder="e.g. 12th Completed, BSc, BTech"
                value={form.qualification}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="course_interest">Course Interested In *</label>
              <select
                id="course_interest"
                name="course_interest"
                value={form.course_interest}
                onChange={handleChange}
                className={errors.course_interest ? 'input-error' : ''}
              >
                <option value="">-- Select Course --</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.course_interest && (
                <span className="field-error">{errors.course_interest}</span>
              )}
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Register Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
