import { getErrorMessage } from './utils/errorHandler.js';

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cf_token');
    this.user = JSON.parse(localStorage.getItem('cf_user') || 'null');
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('cf_token', token);
      localStorage.setItem('cf_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = this.getHeaders();
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      // If 401 Unauthorized, clear auth if user was logged in
      if (response.status === 401 && this.token) {
        this.setAuth(null, null);
        window.dispatchEvent(new CustomEvent('auth-changed'));
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = getErrorMessage(data) || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }
      return data;
    } catch (err) {
      const cleanMsg = getErrorMessage(err);
      console.error(`API Error on ${endpoint}:`, cleanMsg);
      throw new Error(cleanMsg);
    }
  }

  // --- Auth Endpoints ---
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setAuth(data.access_token, data.user);
    return data;
  }

  async register(name, email, password, confirm_password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirm_password })
    });
    this.setAuth(data.access_token, data.user);
    return data;
  }

  async forgotPassword(email, new_password) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, new_password })
    });
  }

  logout() {
    this.setAuth(null, null);
    window.dispatchEvent(new CustomEvent('auth-changed'));
  }

  async getMe() {
    if (!this.token) return null;
    try {
      const user = await this.request('/auth/me');
      this.user = user;
      localStorage.setItem('cf_user', JSON.stringify(user));
      return user;
    } catch {
      return null;
    }
  }

  async updateProfile(name, avatar_url) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, avatar_url })
    });
  }

  async changePassword(current_password, new_password) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  }

  // --- Languages & Topics ---
  async getLanguages(category = null) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/languages${query}`);
  }

  async getLanguageTopics(slug) {
    return this.request(`/languages/${slug}/topics`);
  }

  async getTopicDetail(id) {
    return this.request(`/languages/topics/${id}`);
  }

  // --- Questions ---
  async getQuestions(params = {}) {
    const cleanParams = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
        cleanParams[k] = v;
      }
    }
    const sp = new URLSearchParams(cleanParams).toString();
    return this.request(`/questions${sp ? `?${sp}` : ''}`);
  }

  async getQuestionDetail(id) {
    return this.request(`/questions/${id}`);
  }

  // --- Code Execution ---
  async runCode(code, language, input_data = '', question_id = null) {
    return this.request('/code/run', {
      method: 'POST',
      body: JSON.stringify({ code, language, input_data, question_id })
    });
  }

  async submitCode(question_id, code, language) {
    return this.request('/code/submit', {
      method: 'POST',
      body: JSON.stringify({ question_id, code, language })
    });
  }

  // --- AI Intelligence ---
  async parseIntent(prompt) {
    return this.request('/ai/parse-intent', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
  }

  async generateAIQuestion(params) {
    return this.request('/ai/generate-question', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getAIHint(question_id, hint_level, user_code = '') {
    return this.request('/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ question_id, hint_level, user_code })
    });
  }

  async getAIFeedback(params) {
    return this.request('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // --- Tests & Assessments ---
  async createTest(data) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async listTests() {
    return this.request('/tests');
  }

  async getTestByShareCode(share_code) {
    return this.request(`/tests/${share_code}`);
  }

  async startTestAttempt(share_code, candidate_name, candidate_email) {
    return this.request(`/tests/${share_code}/start`, {
      method: 'POST',
      body: JSON.stringify({ candidate_name, candidate_email })
    });
  }

  async submitTestAttempt(share_code, attempt_id, answers, time_taken_seconds) {
    return this.request(`/tests/${share_code}/submit/${attempt_id}`, {
      method: 'POST',
      body: JSON.stringify({ answers, time_taken_seconds })
    });
  }

  async getTestAnalytics(share_code) {
    return this.request(`/tests/${share_code}/analytics`);
  }

  // --- Dashboard & Analytics ---
  async getDashboardData() {
    return this.request('/dashboard');
  }

  async getSubmissionHistory(params = {}) {
    const sp = new URLSearchParams(params).toString();
    return this.request(`/history${sp ? `?${sp}` : ''}`);
  }

  async globalSearch(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // --- Admin ---
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getReviewQuestions() {
    return this.request('/admin/questions/review');
  }

  async approveQuestion(id) {
    return this.request(`/admin/questions/${id}/approve`, { method: 'POST' });
  }

  async deleteQuestion(id) {
    return this.request(`/admin/questions/${id}`, { method: 'DELETE' });
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async toggleUserRole(userId) {
    return this.request(`/admin/users/${userId}/toggle-role`, { method: 'POST' });
  }

  // --- Settings ---
  async getGeminiSettings() {
    return this.request('/settings/gemini');
  }

  async updateGeminiKey(api_key) {
    return this.request('/settings/gemini', {
      method: 'POST',
      body: JSON.stringify({ api_key })
    });
  }

  async testGeminiConnection() {
    return this.request('/settings/gemini/test', { method: 'POST' });
  }
}

export const api = new ApiClient();
