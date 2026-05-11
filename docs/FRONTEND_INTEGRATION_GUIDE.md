# Frontend Integration Guide

This guide explains how to use the new API service and utilities to connect the frontend React components to the backend API.

## Overview

The frontend now has three main utility files:

1. **apiService.js** - Centralized API client with all endpoints
2. **authContext.js** - Authentication state management
3. **utils.js** - Common helper functions

All these files are automatically loaded in the HTML files and available globally.

---

## Using the API Service

### Basic API Calls

The `campusAPI` object is available globally and provides all API methods:

```javascript
// Get current user
const user = await campusAPI.getMe();
console.log(user);

// List events with filters
const events = await campusAPI.listEvents({
  department: "Computer Science",
  eventType: "Hackathon"
});

// Get single event
const event = await campusAPI.getEvent(1);

// Register for event
const registration = await campusAPI.registerForEvent(1, {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  year: "2nd Year",
  teamSize: 2,
  additionalMembers: [
    { name: "Jane Smith", regNo: "REG002" }
  ],
  notes: "Looking forward to it",
  pricingLabel: "Free Entry"
});
```

### Error Handling

All API methods throw errors on failure. Use try-catch blocks:

```javascript
try {
  const user = await campusAPI.getMe();
  setUser(user);
} catch (error) {
  const message = Utils.formatError(error);
  setMessage({ text: message, type: "error" });
}
```

### Authentication

Tokens are automatically stored and sent with every request:

```javascript
// Sign in
const result = await campusAPI.signin("user@example.com", "password");
console.log(result.user); // User data automatically saved

// Check if authenticated
const token = campusAPI.getToken();
if (!token) {
  window.location.href = "signin.html";
}

// Logout
campusAPI.logout();
```

---

## Using Auth Context

The `authContext` object provides authentication state management:

```javascript
// Check authentication status
const { isAuthenticated, user, role } = authContext.getState();

// Check user role
if (authContext.isStudent()) {
  // Show student-specific UI
}

if (authContext.isOrganizer()) {
  // Show organizer-specific UI
}

// Subscribe to auth changes
const unsubscribe = authContext.subscribe((state) => {
  console.log("Auth state changed:", state);
});

// Cleanup subscription
unsubscribe();

// Require authentication
if (!authContext.requireAuth()) {
  return null; // Will redirect to signin
}

// Require specific role
if (!authContext.requireRole("organizer", "organiser.html")) {
  return null;
}

// Logout
authContext.logout();
```

---

## Using Utilities

The `Utils` object provides common helper functions:

```javascript
// Email validation
if (!Utils.isValidEmail(email)) {
  console.log("Invalid email");
}

// Password validation
if (!Utils.isValidPassword(password)) {
  console.log("Password too short");
}

// Phone validation
if (!Utils.isValidPhone(phone)) {
  console.log("Invalid phone");
}

// Format errors
const message = Utils.formatError(error);

// Get theme state
const { isDark } = Utils.getThemeState();

// Format dates
const dateStr = Utils.formatDate(1621234567890);

// Check if event is past
if (Utils.isEventPast("2024-05-15")) {
  console.log("Event has passed");
}

// Get days until event
const days = Utils.daysUntilEvent("2024-12-15");
console.log(`${days} days until event`);

// Truncate text
const truncated = Utils.truncate("Long text here", 20);

// Get initials
const initials = Utils.getInitials("John", "Doe"); // "JD"

// Copy to clipboard
await Utils.copyToClipboard("text to copy");

// Parse query params
const params = Utils.getQueryParams();
console.log(params.eventId);

// Format file size
const size = Utils.formatBytes(1024); // "1 KB"
```

---

## React Integration Examples

### Student Dashboard Example

```javascript
const { useEffect, useState } = React;

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "idle" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);

      // Check authentication
      if (!campusAPI.getToken()) {
        window.location.href = "signin.html";
        return;
      }

      // Load user profile
      const currentUser = await campusAPI.getMe();
      setUser(currentUser);

      // Load events
      const eventList = await campusAPI.listEvents({
        department: "All",
        eventType: "All"
      });
      setEvents(eventList);

      // Load user's registrations
      const { registrations: myRegs } = await campusAPI.getMyRegistrations();
      setRegistrations(myRegs);
    } catch (error) {
      setMessage({ 
        text: Utils.formatError(error), 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterEvent(eventId) {
    try {
      const registration = await campusAPI.registerForEvent(eventId, {
        name: user.firstName + " " + user.lastName,
        email: user.email,
        phone: "+1234567890",
        year: user.yearOrDesignation,
        teamSize: 1,
        additionalMembers: [],
        notes: "",
        pricingLabel: "Free Entry"
      });

      setMessage({ 
        text: "Successfully registered for event!", 
        type: "success" 
      });

      // Reload registrations
      const { registrations: updated } = await campusAPI.getMyRegistrations();
      setRegistrations(updated);
    } catch (error) {
      setMessage({ 
        text: Utils.formatError(error), 
        type: "error" 
      });
    }
  }

  async function handleCancelRegistration(registrationId) {
    try {
      await campusAPI.cancelRegistration(registrationId);

      setMessage({ 
        text: "Registration cancelled successfully", 
        type: "success" 
      });

      // Reload registrations
      const { registrations: updated } = await campusAPI.getMyRegistrations();
      setRegistrations(updated);
    } catch (error) {
      setMessage({ 
        text: Utils.formatError(error), 
        type: "error" 
      });
    }
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.firstName}</p>

      <section>
        <h2>Available Events ({events.length})</h2>
        {events.map(event => (
          <div key={event.id}>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <button onClick={() => handleRegisterEvent(event.id)}>
              Register
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>My Registrations ({registrations.length})</h2>
        {registrations.map(reg => (
          <div key={reg.id}>
            <h3>{reg.eventTitle}</h3>
            <p>Date: {Utils.formatDate(reg.createdAt)}</p>
            <button onClick={() => handleCancelRegistration(reg.id)}>
              Cancel
            </button>
          </div>
        ))}
      </section>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
```

### Organizer Dashboard Example

```javascript
function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganizerEvents();
  }, []);

  async function loadOrganizerEvents() {
    try {
      setIsLoading(true);
      const eventList = await campusAPI.getOrganizerEvents();
      setEvents(eventList);
    } catch (error) {
      console.error(Utils.formatError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateEvent(eventData) {
    try {
      await campusAPI.createEvent(eventData);
      // Reload events
      await loadOrganizerEvents();
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  async function handleUpdateEvent(eventId, eventData) {
    try {
      await campusAPI.updateEvent(eventId, eventData);
      // Reload events
      await loadOrganizerEvents();
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  async function handleRequestDeletion(eventId, reason) {
    try {
      await campusAPI.requestEventDeletion(eventId, reason);
      // Reload events
      await loadOrganizerEvents();
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  async function handleViewRegistrations(eventId) {
    try {
      const { registrations } = await campusAPI.getEventRegistrations(eventId);
      console.log(registrations);
      // Display registrations
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  return (
    <div>
      <h1>Organizer Dashboard</h1>
      <button onClick={() => handleCreateEvent({
        title: "New Event",
        eventType: "Workshop",
        department: "CSE",
        date: "2024-12-15",
        time: "10:00",
        location: "Auditorium",
        description: "Event description",
        eventPrice: "Free",
        maxTeamSize: 6
      })}>
        Create Event
      </button>

      {events.map(event => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>Status: {event.approvalStatus}</p>
          <p>Registrations: {event.registrationCount}</p>
          <button onClick={() => handleViewRegistrations(event.id)}>
            View Registrations
          </button>
          <button onClick={() => handleUpdateEvent(event.id, {
            title: "Updated Title",
            // ... other fields
          })}>
            Edit
          </button>
          <button onClick={() => handleRequestDeletion(event.id, "Event cancelled")}>
            Request Deletion
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Admin Dashboard Example

```javascript
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await campusAPI.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error(Utils.formatError(error));
    }
  }

  async function loadPendingEvents() {
    try {
      const { events: pendingEvents } = await campusAPI.getAdminEvents("Pending");
      setEvents(pendingEvents);
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  async function handleApproveEvent(eventId) {
    try {
      await campusAPI.approveEvent(eventId);
      await loadStats();
      await loadPendingEvents();
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  async function handleApproveDeletion(eventId) {
    try {
      await campusAPI.approveEventDeletion(eventId);
      await loadStats();
    } catch (error) {
      alert(Utils.formatError(error));
    }
  }

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div className="stats">
        <div>
          <h3>Users</h3>
          <p>Total: {stats.users.total}</p>
          <p>Students: {stats.users.students}</p>
          <p>Organizers: {stats.users.organizers}</p>
        </div>

        <div>
          <h3>Events</h3>
          <p>Total: {stats.events.total}</p>
          <p>Approved: {stats.events.approved}</p>
          <p>Pending: {stats.events.pending}</p>
          <p>Deletion Requests: {stats.events.deletionRequests}</p>
        </div>

        <div>
          <h3>Registrations</h3>
          <p>Total: {stats.registrations.total}</p>
        </div>
      </div>

      <section>
        <h2>Pending Events</h2>
        <button onClick={loadPendingEvents}>Load Events</button>
        {events.map(event => (
          <div key={event.id}>
            <h3>{event.title}</h3>
            <button onClick={() => handleApproveEvent(event.id)}>
              Approve
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## Migration Guide

### Old Way (Direct API Calls)

```javascript
const response = await fetch(`${API_BASE}/events`, {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

### New Way (Using API Service)

```javascript
const events = await campusAPI.listEvents();
```

---

## Best Practices

1. **Always use try-catch** when calling API methods
2. **Use Utils.formatError()** for consistent error messages
3. **Check authentication** before rendering protected routes
4. **Use authContext** for role-based UI rendering
5. **Handle loading states** with useState
6. **Validate input** using Utils validation methods
7. **Store tokens** automatically (handled by API service)
8. **Clean up subscriptions** when unsubscribing from auth context

---

## API Service Methods Summary

### Authentication
- `sendOTP(email)` - Send OTP code
- `verifyOTP(email, code)` - Verify OTP
- `register(payload)` - Create new account
- `signin(email, password)` - Sign in user
- `getMe()` - Get current user
- `adminLogin(email, password)` - Admin login

### User Profile
- `getProfile()` - Get user profile
- `updateProfile(payload)` - Update profile

### Events
- `listEvents(filters)` - List approved events
- `getEvent(eventId)` - Get event details
- `createEvent(payload)` - Create event (organizer)
- `updateEvent(eventId, payload)` - Update event (organizer)
- `getOrganizerEvents()` - Get organizer's events
- `requestEventDeletion(eventId, reason)` - Request deletion

### Registrations
- `registerForEvent(eventId, payload)` - Register for event
- `getMyRegistrations()` - Get user's registrations
- `cancelRegistration(registrationId)` - Cancel registration
- `getEventRegistrations(eventId)` - Get event registrations (organizer)

### Admin
- `getAdminUsers()` - Get all users
- `getAdminEvents(status)` - Get events by status
- `getDeletionRequests()` - Get deletion requests
- `getAdminRegistrations(limit)` - Get all registrations
- `approveEvent(eventId)` - Approve event
- `approveEventDeletion(eventId)` - Approve deletion
- `getAdminStats()` - Get dashboard stats

### Payments
- `createPaymentIntent(payload)` - Create payment
- `confirmPayment(payload)` - Confirm payment

---

## Troubleshooting

### Token not sent with requests
- Check that token is stored: `console.log(campusAPI.getToken())`
- Verify headers are correct in Network tab

### API returns 401 Unauthorized
- Token may be expired
- Try logging out and in again: `campusAPI.logout()` and sign in

### CORS errors
- Ensure backend is running on correct port (4000)
- Check FRONTEND_ORIGIN env var on backend

### API service not available
- Make sure apiService.js is loaded before JSX file
- Check browser console for errors
- Verify script tags in HTML file

