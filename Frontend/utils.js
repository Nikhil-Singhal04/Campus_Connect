/**
 * Campus Connect Utilities
 * Common helper functions for frontend
 */

const Utils = {
  /**
   * Format error message for display
   */
  formatError(error) {
    if (typeof error === "string") {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.data?.message) {
      return error.data.message;
    }

    return "An error occurred. Please try again.";
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email || "");
  },

  /**
   * Validate password strength
   */
  isValidPassword(password) {
    return password && password.length >= 8;
  },

  /**
   * Validate phone number
   */
  isValidPhone(phone) {
    return /^\+?[0-9\-\s]{7,15}$/.test(phone || "");
  },

  /**
   * Validate username format
   */
  isValidUsername(username) {
    return /^[a-z0-9_]{4,16}$/.test(username || "");
  },

  /**
   * Get theme state
   */
  getThemeState() {
    return window.CampusConnectTheme?.getThemeState?.() || { isDark: false, resolved: "light" };
  },

  /**
   * Get fallback image
   */
  getFallbackEventImage() {
    return "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";
  },

  /**
   * Format date for display
   */
  formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(typeof timestamp === "number" ? timestamp : parseInt(timestamp));
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  },

  /**
   * Format time for display
   */
  formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":").map(x => parseInt(x));
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours || 12;
      return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
    } catch {
      return timeStr;
    }
  },

  /**
   * Check if event is past
   */
  isEventPast(dateStr) {
    if (!dateStr) return false;
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return eventDate < today;
    } catch {
      return false;
    }
  },

  /**
   * Check if event is today
   */
  isEventToday(dateStr) {
    if (!dateStr) return false;
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    } catch {
      return false;
    }
  },

  /**
   * Get days until event
   */
  daysUntilEvent(dateStr) {
    if (!dateStr) return null;
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diff = eventDate - today;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch {
      return null;
    }
  },

  /**
   * Truncate text
   */
  truncate(text, length = 100) {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substr(0, length) + "...";
  },

  /**
   * Get initials from name
   */
  getInitials(firstName, lastName) {
    const first = (firstName || "").charAt(0).toUpperCase();
    const last = (lastName || "").charAt(0).toUpperCase();
    return (first + last) || "U";
  },

  /**
   * Debounce function
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Format bytes for file size
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  /**
   * Parse query parameters
   */
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    for (const [key, value] of params) {
      obj[key] = value;
    }
    return obj;
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
};

window.Utils = Utils;
