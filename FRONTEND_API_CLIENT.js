/**
 * API Client for DSAForge Authentication
 * Place this in src/services/api.js
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Set token in localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    }
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem('authToken');
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization token if it exists
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  register(name, email, password, college, year) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, college, year }),
    });
  }

  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  getCurrentUser() {
    return this.request('/api/auth/me', {
      method: 'GET',
    });
  }

  updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  verifyToken() {
    return this.request('/api/auth/verify-token', {
      method: 'POST',
    });
  }
}

export default new APIClient(API_BASE_URL);
