/**
 * Centralized API error handling utility
 */

export const API_ERRORS = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse API error response and return user-friendly message
 * @param {Error|Response} error - The error object or response
 * @returns {string} - User-friendly error message
 */
export async function getErrorMessage(error) {
  try {
    // Network error
    if (!error.status) {
      return API_ERRORS.NETWORK_ERROR;
    }

    // Handle different status codes
    if (error.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    if (error.status === 404) {
      return API_ERRORS.NOT_FOUND;
    }

    if (error.status === 400) {
      const data = await error.json();
      return data.message || API_ERRORS.VALIDATION_ERROR;
    }

    if (error.status >= 500) {
      return API_ERRORS.SERVER_ERROR;
    }

    // Try to parse error message from response
    const data = await error.json();
    return data.message || API_ERRORS.UNKNOWN;
  } catch (e) {
    return API_ERRORS.UNKNOWN;
  }
}

/**
 * Fetch wrapper with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response or error
 */
export async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = new Error(API_ERRORS.UNKNOWN);
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      const networkError = new Error(API_ERRORS.NETWORK_ERROR);
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}

/**
 * Validate form fields and return errors
 * @param {Object} fields - Form fields to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation errors
 */
export function validateForm(fields, rules) {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = fields[field];

    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }

    // Min length validation
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      return;
    }

    // Max length validation
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
      return;
    }

    // Pattern validation
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${rule.label || field} format is invalid`;
      return;
    }

    // Custom validation
    if (rule.custom && value) {
      const customError = rule.custom(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
}

/**
 * Format API error for display
 * @param {Object} error - Error object
 * @returns {string} - Formatted error message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return API_ERRORS.UNKNOWN;
}

/**
 * Log error for debugging
 * @param {Error} error - The error to log
 * @param {string} context - Context where error occurred
 */
export function logError(error, context = '') {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
}
