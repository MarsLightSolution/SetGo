import React, { useState, useEffect } from 'react';

function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 300; // 5 minutes in seconds

  // Lockout timer
  useEffect(() => {
    let interval;
    if (isLocked && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  // Validation rules
  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (email.length > 254) return 'Email is too long';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 128) return 'Password is too long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError('');
    
    // Real-time validation for touched fields
    if (touched[name]) {
      if (name === 'email') {
        setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
      } else if (name === 'password') {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    if (name === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      setLoginError(`Account locked. Try again in ${formatTime(lockoutTime)}`);
      return;
    }

    setTouched({ email: true, password: true });
    
    if (!validateForm()) return;

    setIsLoading(true);
    setLoginError('');

    try {
      // Simulate API call - Replace with actual authentication logic
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulated authentication check
      // In production, this would be an actual API call
      const isAuthenticated = formData.email === 'admin@example.com' && formData.password === 'Admin@123';
      
      if (isAuthenticated) {
        // Success - redirect or update state
        console.log('Login successful!', { email: formData.email, rememberMe });
        // window.location.href = '/admin/dashboard';
        alert('Login successful! Redirecting to dashboard...');
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTime(LOCKOUT_DURATION);
          setLoginError(`Too many failed attempts. Account locked for ${formatTime(LOCKOUT_DURATION)}`);
        } else {
          setLoginError(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#ef4444' };
    if (strength <= 4) return { strength: 66, label: 'Medium', color: '#f59e0b' };
    return { strength: 100, label: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div style={styles.container}>
      <div style={styles.backgroundOverlay}></div>
      
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <svg style={styles.logo} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={styles.title}>Admin Portal</h1>
          <p style={styles.subtitle}>Sign in to access the dashboard</p>
        </div>

        {loginError && (
          <div style={styles.errorAlert}>
            <svg style={styles.alertIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{loginError}</span>
          </div>
        )}

        {isLocked && (
          <div style={styles.lockoutTimer}>
            <svg style={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Account locked: {formatTime(lockoutTime)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <div style={styles.inputWrapper}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="admin@example.com"
                style={{
                  ...styles.input,
                  ...(errors.email && touched.email ? styles.inputError : {}),
                }}
                disabled={isLocked || isLoading}
                autoComplete="email"
                aria-invalid={errors.email && touched.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && touched.email && (
              <span id="email-error" style={styles.errorText}>{errors.email}</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.inputWrapper}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                style={{
                  ...styles.input,
                  ...(errors.password && touched.password ? styles.inputError : {}),
                }}
                disabled={isLocked || isLoading}
                autoComplete="current-password"
                aria-invalid={errors.password && touched.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLocked || isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.eyeIcon}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.eyeIcon}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <span id="password-error" style={styles.errorText}>{errors.password}</span>
            )}
            
            {formData.password && touched.password && (
              <div style={styles.strengthContainer}>
                <div style={styles.strengthBar}>
                  <div
                    style={{
                      ...styles.strengthFill,
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span style={{ ...styles.strengthLabel, color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
                disabled={isLocked || isLoading}
              />
              <span style={styles.checkboxText}>Remember me</span>
            </label>
            <a href="#forgot-password" style={styles.forgotLink}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(isLocked || isLoading ? styles.submitButtonDisabled : {}),
            }}
            disabled={isLocked || isLoading}
          >
            {isLoading ? (
              <div style={styles.loadingSpinner}>
                <div style={styles.spinner}></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Protected by enterprise-grade security
          </p>
          <div style={styles.securityBadges}>
            <span style={styles.badge}>🔒 SSL Secured</span>
            <span style={styles.badge}>🛡️ 2FA Ready</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
    padding: '20px',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  backgroundOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    padding: '40px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.5s ease-out',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
  },
  logo: {
    width: '32px',
    height: '32px',
    color: 'white',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#dc2626',
    fontSize: '14px',
  },
  alertIcon: {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  lockoutTimer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#b45309',
    fontSize: '14px',
    fontWeight: '500',
  },
  lockIcon: {
    width: '18px',
    height: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    width: '18px',
    height: '18px',
    color: '#9ca3af',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 44px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f9fafb',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: '20px',
    height: '20px',
    color: '#6b7280',
  },
  errorText: {
    fontSize: '13px',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  strengthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '6px',
  },
  strengthBar: {
    flex: 1,
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    transition: 'all 0.3s ease',
    borderRadius: '2px',
  },
  strengthLabel: {
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '50px',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#4b5563',
  },
  forgotLink: {
    fontSize: '14px',
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px -3px rgba(99, 102, 241, 0.4)',
    marginTop: '8px',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0 0 12px 0',
  },
  securityBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  badge: {
    fontSize: '12px',
    color: '#6b7280',
  },
};

export default AdminLogin;