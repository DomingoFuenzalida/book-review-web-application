let currentUser = null;

export const Auth = {
  getUser: () => currentUser,
  
  async login(username, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        currentUser = await res.json();
        return { success: true };
      }
      const error = await res.json();
      return { success: false, message: error.error || 'Login failed' };
    } catch (e) {
      return { success: false, message: 'Network error' };
    }
  },

  logout() { currentUser = null; }
};

export const API = {
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentUser) headers['x-user-id'] = currentUser.id;
    return headers;
  },

  async request(endpoint, method = 'GET', body = null) {
    const options = { method, headers: this.getHeaders() };
    if (body) options.body = JSON.stringify(body);
    
    try {
      const res = await fetch(`/api${endpoint}`, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (res.status === 204) return {};
      return await res.json();
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      return null;
    }
  }
};