import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheck, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import api from '../api/axios';
import './Auth.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '', password: '', email: '', fullName: '',
    collegeName: '', collegeEmail: '', otp: ''
  });
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [verifyMethod, setVerifyMethod] = useState('email'); // 'email' | 'idcard'
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { register } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  };

  const handleSendOtp = async () => {
    if (!form.collegeEmail) return addToast('Please enter your college email first', 'error');
    if (resendTimer > 0) return addToast(`Please wait ${resendTimer}s before resending`, 'error');
    
    setSendingOtp(true);
    try {
      await api.post('/auth/send-otp', { email: form.collegeEmail });
      setOtpSent(true);
      setResendTimer(60);
      addToast('OTP sent to your email', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const canGoStep2 = form.username && form.password;
  const canSubmit = form.collegeName && (
    (verifyMethod === 'email' && form.collegeEmail && form.otp) ||
    (verifyMethod === 'idcard' && idCardFile)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return addToast('Please complete all verification fields', 'error');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('password', form.password);
      formData.append('email', form.email);
      formData.append('fullName', form.fullName);
      formData.append('collegeName', form.collegeName);
      if (verifyMethod === 'email') {
        formData.append('collegeEmail', form.collegeEmail);
        formData.append('otp', form.otp);
      }
      if (idCardFile && verifyMethod === 'idcard') {
        formData.append('idCardImage', idCardFile);
      }

      await register(formData);
      addToast('Account created!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient"></div>
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="auth-logo gradient-text">FriendZone</h1>
        <p className="auth-subtitle">
          {step === 1 ? 'Create your account' : 'Verify your student identity'}
        </p>

        {/* Step indicators */}
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? 'auth-step--active' : ''}`}>1</div>
          <div className="auth-step-line"></div>
          <div className={`auth-step ${step >= 2 ? 'auth-step--active' : ''}`}>2</div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="auth-step-content"
              >
                <input
                  id="register-fullname"
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange}
                  className="auth-input"
                />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="Personal Email (optional)"
                  value={form.email}
                  onChange={handleChange}
                  className="auth-input"
                />
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="auth-input"
                  autoComplete="username"
                />
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-btn"
                  disabled={!canGoStep2}
                  onClick={() => setStep(2)}
                >
                  Next <FiChevronRight />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="auth-step-content"
              >
                <input
                  id="register-college"
                  type="text"
                  name="collegeName"
                  placeholder="College / University Name"
                  value={form.collegeName}
                  onChange={handleChange}
                  className="auth-input"
                />

                {/* Verification method toggle */}
                <div className="verify-toggle">
                  <button
                    type="button"
                    className={`verify-toggle-btn ${verifyMethod === 'email' ? 'verify-toggle-btn--active' : ''}`}
                    onClick={() => setVerifyMethod('email')}
                  >
                    College Email
                  </button>
                  <button
                    type="button"
                    className={`verify-toggle-btn ${verifyMethod === 'idcard' ? 'verify-toggle-btn--active' : ''}`}
                    onClick={() => setVerifyMethod('idcard')}
                  >
                    ID Card Upload
                  </button>
                </div>

                {verifyMethod === 'email' ? (
                  <div className="verify-section">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="register-college-email"
                        type="email"
                        name="collegeEmail"
                        placeholder="your.name@college.edu"
                        value={form.collegeEmail}
                        onChange={handleChange}
                        className="auth-input"
                        disabled={otpSent && resendTimer > 0}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="auth-btn"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || (otpSent && resendTimer > 0) || !form.collegeEmail}
                        style={{ marginTop: 0, padding: '0 16px', width: 'auto', whiteSpace: 'nowrap' }}
                      >
                        {sendingOtp ? 'Sending...' : otpSent ? (resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP') : 'Send OTP'}
                      </button>
                    </div>
                    {otpSent && (
                      <input
                        type="text"
                        name="otp"
                        placeholder="Enter 6-digit OTP"
                        value={form.otp}
                        onChange={handleChange}
                        className="auth-input"
                        maxLength="6"
                        autoComplete="one-time-code"
                      />
                    )}
                    <p className="verify-hint">
                      Use your .edu / .ac.in email for instant verification
                    </p>
                  </div>
                ) : (
                  <div className="verify-section">
                    {idCardPreview ? (
                      <div className="verify-preview">
                        <img src={idCardPreview} alt="ID Card" />
                        <div className="verify-preview-badge">
                          <FiCheck /> Uploaded
                        </div>
                      </div>
                    ) : (
                      <label className="verify-upload" htmlFor="id-card-upload">
                        <FiUpload className="verify-upload-icon" />
                        <span>Upload your College ID Card</span>
                        <span className="verify-upload-hint">JPG, PNG — clear photo of front side</span>
                        <input
                          id="id-card-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleIdCardChange}
                          hidden
                        />
                      </label>
                    )}
                    <p className="verify-hint">
                      ID card will be reviewed by admin (usually within 24 hours)
                    </p>
                  </div>
                )}

                <div className="auth-step-actions">
                  <button
                    type="button"
                    className="auth-back-btn"
                    onClick={() => setStep(1)}
                  >
                    <FiChevronLeft /> Back
                  </button>
                  <button
                    id="register-submit"
                    type="submit"
                    className="auth-btn"
                    disabled={loading || !canSubmit}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="auth-divider"><span>OR</span></div>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-switch-link">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
