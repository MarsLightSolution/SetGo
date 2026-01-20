/**
 * Input Validation Utilities
 *
 * Provides validation functions for common input types.
 * Use these to validate user input before API calls.
 */

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;

// Phone number regex (international format)
const PHONE_REGEX = /^\+?[\d\s\-()]{10,}$/;

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = PASSWORD_MIN_LENGTH,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (requireNumber && !/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { isValid: true };
};

/**
 * Validate password confirmation matches
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (!PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
};

/**
 * Validate required text field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @param {Object} options - Validation options
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateRequired = (value, fieldName = 'This field', options = {}) => {
  const { minLength = 1, maxLength = null } = options;

  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    if (minLength === 1) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (maxLength && trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`,
    };
  }

  return { isValid: true };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username must be no more than 30 characters' };
  }

  // Allow letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
};

/**
 * Validate price
 * @param {number|string} price - Price to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validatePrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Please enter a valid price' };
  }

  if (numPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  if (numPrice > 1000000000) {
    return { isValid: false, error: 'Price is too high' };
  }

  return { isValid: true };
};

/**
 * Validate postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validatePostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== 'string') {
    return { isValid: false, error: 'Postal code is required' };
  }

  const trimmed = postalCode.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Please enter a valid postal code' };
  }

  return { isValid: true };
};

/**
 * Validate login form
 * @param {Object} data - { email, password }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateLoginForm = (data) => {
  const errors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate signup form
 * @param {Object} data - { email, password, confirmPassword, username }
 * @returns {{ isValid: boolean, errors: Object }}
 */
export const validateSignupForm = (data) => {
  const errors = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error;
  }

  if (data.confirmPassword !== undefined) {
    const matchResult = validatePasswordMatch(data.password, data.confirmPassword);
    if (!matchResult.isValid) {
      errors.confirmPassword = matchResult.error;
    }
  }

  if (data.username !== undefined) {
    const usernameResult = validateUsername(data.username);
    if (!usernameResult.isValid) {
      errors.username = usernameResult.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

export default {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validateRequired,
  validateUsername,
  validatePrice,
  validatePostalCode,
  validateLoginForm,
  validateSignupForm,
  sanitizeInput,
};
