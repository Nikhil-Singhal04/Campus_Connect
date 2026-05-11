/**
 * Campus Connect Auth Context Helper
 * Provides auth state management utilities
 */

class AuthContext {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
  }

  loadState() {
    return {
      token: localStorage.getItem("cc_token"),
      user: this.loadUser(),
      isAuthenticated: !!localStorage.getItem("cc_token"),
      role: this.getRole()
    };
  }

  loadUser() {
    try {
      const raw = localStorage.getItem("cc_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getRole() {
    const user = this.loadUser();
    return user?.accountType?.toLowerCase() || null;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  setAuthenticated(token, user) {
    localStorage.setItem("cc_token", token);
    localStorage.setItem("cc_user", JSON.stringify(user));
    this.setState({
      token,
      user,
      isAuthenticated: true,
      role: user?.accountType?.toLowerCase() || null
    });
  }

  logout() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    this.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      role: null
    });
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  isStudent() {
    return this.state.role === "student";
  }

  isOrganizer() {
    return this.state.role === "organizer";
  }

  isAdmin() {
    return this.state.role === "admin";
  }

  requireAuth(redirectTo = "/signin.html") {
    if (!this.state.isAuthenticated) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  requireRole(role, redirectTo = "/signin.html") {
    if (this.state.role !== role.toLowerCase()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
}

// Export singleton instance
const authContext = new AuthContext();
window.authContext = authContext;
