import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import Logo from './Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const otpInputsRef = useRef([]);

  // Clear error when email or OTP changes
  useEffect(() => {
    setError('');
  }, [email, otp]);

  // Focus first OTP input when step changes to 2
  useEffect(() => {
    if (step === 2 && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [step]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate network delay for OTP dispatch
    setTimeout(() => {
      // Generate a random 6 digit OTP for the demo
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtp(code);
      setStep(2);
      setLoading(false);
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on backspace if empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d{6}$/.test(pastedData)) {
      const charArray = pastedData.split('');
      setOtp(charArray);
      otpInputsRef.current[5].focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate OTP verification delay
    setTimeout(() => {
      if (enteredOtp === demoOtp || enteredOtp === '123456') { // Allow '123456' as back-up master OTP
        localStorage.setItem('efos_authenticated', 'true');
        localStorage.setItem('efos_user_email', email);
        setLoading(false);
        navigate('/dashboard');
      } else {
        setLoading(false);
        setError('Invalid OTP code. Please try again.');
      }
    }, 1000);
  };

  return (
    <div className="login-page-container">
      {/* Dynamic drifting background blobs */}
      <div className="login-bg-blob login-bg-blob-1"></div>
      <div className="login-bg-blob login-bg-blob-2"></div>
      <div className="login-bg-blob login-bg-blob-3"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Logo size="52px" />
          </div>
          <h2>EFOS Counselor Portal</h2>
          <p>Secure Lead Management System</p>
        </div>

        {error && (
          <div className="login-error-message">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="login-form-group">
              <label className="login-input-label">COUNSELOR EMAIL</label>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  className="login-input"
                  placeholder="Enter email to receive OTP"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <span className="login-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="login-loading-spinner"></div>
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Demo OTP</span>
                  <div className="login-btn-shimmer"></div>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            {demoOtp && (
              <div className="demo-otp-banner">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
                <div className="demo-otp-text">
                  A verification code has been dispatched. Enter the demo OTP:
                  <span className="demo-otp-badge">{demoOtp}</span>
                </div>
              </div>
            )}

            <div className="login-form-group">
              <label className="login-input-label" style={{ textAlign: 'center', display: 'block' }}>
                ENTER VERIFICATION CODE
              </label>
              <div className="otp-container" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    className="otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="login-loading-spinner"></div>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Login</span>
                  <div className="login-btn-shimmer"></div>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <div 
                className="login-back-link" 
                onClick={() => {
                  if (!loading) {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Email
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
