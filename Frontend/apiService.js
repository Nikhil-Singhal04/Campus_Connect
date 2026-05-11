/**
 * Campus Connect API Service
 * Centralized API client for all endpoints
 */

const API_HOST = window.location.hostname || "127.0.0.1";
const API_BASE = `http://${API_HOST}:4000/api`;

class CampusConnectAPI {
  constructor() {
    this.baseURL = API_BASE;
    this.tokenKey = "cc_token";
    this.userKey = "cc_user";
  }

  /**
   * Get stored authentication token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Store authentication token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  /**
   * Get stored user data
   */
  getUser() {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Store user data
   */
  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  /**
   * Clear authentication
   */
  logout() {
    this.setToken(null);
    this.setUser(null);
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "API request failed");
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // ============ Authentication Endpoints ============

  /**
   * Send OTP to email
   */
  async sendOTP(email) {
    return this.request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email, code) {
    return this.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, code })
    });
  }

  /**
   * Register new user
   */
  async register(payload) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Sign in user
   */
  async signin(email, password) {
    const response = await this.request("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
    }

    return response;
  }

  /**
   * Get current user session
   */
  async getMe() {
    const response = await this.request("/auth/me");
    return response.user;
  }

  /**
   * Admin login
   */
  async adminLogin(email, password) {
    const response = await this.request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // ============ User Profile Endpoints ============

  /**
   * Get user profile
   */
  async getProfile() {
    const response = await this.request("/profile");
    return response.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(payload) {
    return this.request("/profile", {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  // ============ Events Endpoints ============

  /**
   * List approved events with optional filters
   */
  async listEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department) params.append("department", filters.department);
    if (filters.eventType) params.append("eventType", filters.eventType);

    const query = params.toString();
    const endpoint = query ? `/events?${query}` : "/events";

    const response = await this.request(endpoint);
    return response.events;
  }

  /**
   * Get single event details
   */
  async getEvent(eventId) {
    const response = await this.request(`/events/${eventId}`);
    return response.event;
  }

  /**
   * Create new event (organizer)
   */
  async createEvent(payload) {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update event (organizer)
   */
  async updateEvent(eventId, payload) {
    return this.request(`/organizer/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  /**
   * Get organizer's events
   */
  async getOrganizerEvents() {
    const response = await this.request("/organizer/events");
    return response.events;
  }

  /**
   * Request event deletion (organizer)
   */
  async requestEventDeletion(eventId, reason) {
    return this.request(`/organizer/events/${eventId}/delete-request`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Get event registrations (organizer)
   */
  async getEventRegistrations(eventId) {
    const response = await this.request(`/organizer/events/${eventId}/registrations`);
    return {
      event: response.event,
      registrations: response.registrations,
      count: response.count
    };
  }

  // ============ Event Registration Endpoints ============

  /**
   * Register for event
   */
  async registerForEvent(eventId, payload) {
    const response = await this.request(`/events/${eventId}/register`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response.registration;
  }

  /**
   * Get user's event registrations
   */
  async getMyRegistrations() {
    const response = await this.request("/me/registrations");
    return {
      registrations: response.registrations,
      count: response.count
    };
  }

  /**
   * Cancel event registration
   */
  async cancelRegistration(registrationId) {
    return this.request(`/me/registrations/${registrationId}`, {
      method: "DELETE"
    });
  }

  // ============ Admin Endpoints ============

  /**
   * Get all users (admin)
   */
  async getAdminUsers() {
    const response = await this.request("/admin/users");
    return {
      users: response.users,
      count: response.count
    };
  }

  /**
   * Get all events (admin)
   */
  async getAdminEvents(status = "Pending") {
    const response = await this.request(`/admin/events?status=${status}`);
    return {
      events: response.events,
      count: response.count
    };
  }

  /**
   * Get deletion requests (admin)
   */
  async getDeletionRequests() {
    const response = await this.request("/admin/events/deletion-requests");
    return {
      events: response.events,
      count: response.count
    };
  }

  /**
   * Get all registrations (admin)
   */
  async getAdminRegistrations(limit = 100) {
    const response = await this.request(`/admin/registrations?limit=${limit}`);
    return {
      registrations: response.registrations,
      count: response.count
    };
  }

  /**
   * Approve event (admin)
   */
  async approveEvent(eventId) {
    return this.request(`/admin/events/${eventId}/approve`, {
      method: "PATCH"
    });
  }

  /**
   * Approve event deletion (admin)
   */
  async approveEventDeletion(eventId) {
    return this.request(`/admin/events/${eventId}/approve-delete`, {
      method: "PATCH"
    });
  }

  /**
   * Get dashboard statistics (admin)
   */
  async getAdminStats() {
    const response = await this.request("/admin/stats");
    return response;
  }

  // ============ Payment Endpoints ============

  /**
   * Create payment intent
   */
  async createPaymentIntent(payload) {
    const response = await this.request("/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response;
  }

  /**
   * Confirm payment
   */
  async confirmPayment(payload) {
    const response = await this.request("/payments/confirm", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return response;
  }

  // ============ Health Check ============

  /**
   * Check API health
   */
  async health() {
    return this.request("/health");
  }
}

// Export singleton instance
const campusAPI = new CampusConnectAPI();

// Make available globally for backward compatibility
window.campusAPI = campusAPI;
