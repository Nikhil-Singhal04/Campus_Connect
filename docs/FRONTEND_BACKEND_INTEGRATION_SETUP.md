# Frontend-Backend Integration Setup & Testing

## Quick Start

### 1. Verify Backend is Running

```bash
# Terminal at Campus_Connect directory
npm run start:windows  # Windows
# or
bash run-backend-final.sh  # Unix
```

**Expected Output:**
```
Auth API listening on http://127.0.0.1:4000
```

### 2. Files Created

Three new utility files are now available:

**Frontend/apiService.js**
- Centralized API client
- All 30+ endpoints
- Automatic token management
- Global as `campusAPI`

**Frontend/authContext.js**
- Authentication state management
- Role checking (student, organizer, admin)
- Subscription support
- Global as `authContext`

**Frontend/utils.js**
- Common helper functions
- Validation utilities
- Date/time formatting
- Global as `Utils`

### 3. HTML Files Updated

All HTML files now include the new scripts:
- signin.html ✓
- signup.html ✓
- dashboard.html ✓
- organiser.html ✓
- admin.html ✓
- profile.html ✓
- event-register.html ✓
- payment.html ✓
- settings.html ✓

---

## Testing in Browser Console

### Test 1: Check API Service is Available

```javascript
// In browser console
console.log(campusAPI);
// Should show the API service object with all methods

// Test health check
await campusAPI.health();
// Should return: { ok: true, service: "campus-connect-auth-api" }
```

### Test 2: Test Authentication

```javascript
// Test signup/signin flow
const otpResult = await campusAPI.sendOTP("test@example.com");
console.log(otpResult); // Should return message and providerMessageId

// Verify with OTP code (check backend logs for dev OTP code)
const verifyResult = await campusAPI.verifyOTP("test@example.com", "123456");
console.log(verifyResult); // Should return signupProofToken

// Register
const registerResult = await campusAPI.register({
  signupProofToken: verifyResult.signupProofToken,
  accountType: "Student",
  firstName: "John",
  lastName: "Doe",
  regNo: "REG001",
  department: "CSE",
  programOrUnit: "Bachelor of Science",
  yearOrDesignation: "2nd Year",
  email: "test@example.com",
  username: "johndoe123",
  password: "SecurePassword123"
});
console.log(registerResult); // Should have token
```

### Test 3: Test Token Management

```javascript
// Get stored token
const token = campusAPI.getToken();
console.log(token); // Should show JWT token

// Get stored user
const user = campusAPI.getUser();
console.log(user); // Should show user data

// Get current session
const currentUser = await campusAPI.getMe();
console.log(currentUser); // Should return user profile
```

### Test 4: Test Events API

```javascript
// List approved events
const events = await campusAPI.listEvents();
console.log(events); // Should return array of events

// Filter events
const filtered = await campusAPI.listEvents({
  department: "CSE",
  eventType: "Hackathon"
});
console.log(filtered);

// Get single event
const event = await campusAPI.getEvent(1);
console.log(event); // Should have event details and registration count
```

### Test 5: Test Auth Context

```javascript
// Check auth state
console.log(authContext.getState());
// Should show: { token, user, isAuthenticated, role }

// Check role
console.log(authContext.isStudent()); // true/false
console.log(authContext.isOrganizer()); // true/false
console.log(authContext.isAdmin()); // true/false

// Subscribe to changes
const unsub = authContext.subscribe((state) => {
  console.log("Auth changed:", state);
});

// Unsubscribe
unsub();
```

### Test 6: Test Utilities

```javascript
// Validation
console.log(Utils.isValidEmail("test@example.com")); // true
console.log(Utils.isValidEmail("invalid")); // false

// Date formatting
console.log(Utils.formatDate(Date.now()));

// Event date checking
console.log(Utils.isEventPast("2024-01-01")); // true
console.log(Utils.daysUntilEvent("2025-12-15")); // number of days

// Text utilities
console.log(Utils.truncate("Long text here", 10)); // "Long tex..."
console.log(Utils.getInitials("John", "Doe")); // "JD"

// Error formatting
const error = new Error("Test error");
console.log(Utils.formatError(error)); // "Test error"
```

---

## Common API Flows

### Student Registration & Event Signup

```javascript
// 1. Send OTP
const otpResult = await campusAPI.sendOTP("student@example.com");

// 2. Verify OTP (get code from email or backend logs in dev)
const verifyResult = await campusAPI.verifyOTP("student@example.com", "123456");

// 3. Register account
const registerResult = await campusAPI.register({
  signupProofToken: verifyResult.signupProofToken,
  accountType: "Student",
  firstName: "Alice",
  lastName: "Smith",
  regNo: "S12345",
  department: "CSE",
  programOrUnit: "B.Tech",
  yearOrDesignation: "2nd Year",
  email: "student@example.com",
  username: "alice_smith",
  password: "SecurePass123"
});

// 4. Token automatically saved
console.log(campusAPI.getToken()); // JWT token

// 5. List available events
const events = await campusAPI.listEvents();

// 6. Register for event
const registration = await campusAPI.registerForEvent(1, {
  name: "Alice Smith",
  email: "student@example.com",
  phone: "+1234567890",
  year: "2nd Year",
  teamSize: 1,
  additionalMembers: [],
  notes: "Looking forward to it!",
  pricingLabel: "Free Entry"
});

// 7. View my registrations
const { registrations } = await campusAPI.getMyRegistrations();
console.log(registrations);

// 8. Cancel registration if needed
await campusAPI.cancelRegistration(registration.id);
```

### Organizer Event Management

```javascript
// 1. Sign in as organizer
const signinResult = await campusAPI.signin("organizer@example.com", "password");
console.log(signinResult.user.accountType); // "Organizer"

// 2. Create event
await campusAPI.createEvent({
  title: "Hackathon 2024",
  eventType: "Hackathon",
  department: "CSE",
  date: "2024-12-15",
  time: "09:00",
  location: "Main Auditorium",
  description: "24-hour coding competition",
  eventPrice: "Free",
  maxTeamSize: 4,
  posterImage: "data:image/png;base64,..." // base64 image or empty
});

// 3. Get organizer's events
const orgEvents = await campusAPI.getOrganizerEvents();

// 4. Update event (submits for re-approval)
await campusAPI.updateEvent(1, {
  title: "Hackathon 2024 - Updated",
  location: "New Venue",
  // ... other fields
});

// 5. View registrations for event
const { registrations } = await campusAPI.getEventRegistrations(1);
console.log(registrations);

// 6. Request event deletion
await campusAPI.requestEventDeletion(1, "Event cancelled due to venue unavailability");
```

### Admin Approval Workflow

```javascript
// 1. Admin login
const adminResult = await campusAPI.adminLogin("admin@example.com", "admin_password");

// 2. Get dashboard stats
const stats = await campusAPI.getAdminStats();
console.log(stats.users); // Total users by type
console.log(stats.events); // Event statistics
console.log(stats.registrations); // Registration counts

// 3. Get pending events
const { events: pendingEvents } = await campusAPI.getAdminEvents("Pending");

// 4. Approve event
await campusAPI.approveEvent(pendingEvents[0].id);

// 5. Get deletion requests
const { events: deletionRequests } = await campusAPI.getDeletionRequests();

// 6. Approve deletion
await campusAPI.approveEventDeletion(deletionRequests[0].id);

// 7. View all registrations
const { registrations } = await campusAPI.getAdminRegistrations(100);

// 8. Get all users
const { users } = await campusAPI.getAdminUsers();
```

---

## Debugging Tips

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Perform an action (e.g., sign in)
4. Look for API calls like `/auth/signin`
5. Check response status and body

### Check Local Storage

```javascript
// View all stored data
console.table(localStorage);

// Check specific values
console.log(localStorage.getItem("cc_token"));
console.log(JSON.parse(localStorage.getItem("cc_user")));
```

### Enable Backend Debugging

Set `NODE_ENV=development` to get detailed error messages:

```bash
NODE_ENV=development npm run start
```

### Check CORS Issues

If you see CORS errors:
1. Verify backend is running
2. Check `FRONTEND_ORIGIN` env var matches your frontend URL
3. Ensure APIs are allowed in CORS middleware

### Test with curl

```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test signin
curl -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test with token
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Integration Checklist

- [ ] Backend running on port 4000
- [ ] apiService.js loaded in all HTML files
- [ ] authContext.js loaded in all HTML files
- [ ] utils.js loaded in all HTML files
- [ ] campusAPI available in console
- [ ] authContext available in console
- [ ] Utils available in console
- [ ] API health check passes
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Event listing works
- [ ] Event registration works
- [ ] Profile management works
- [ ] Admin dashboard works

---

## Documentation Files

- **API_DOCUMENTATION.md** - Complete API endpoint reference
- **FRONTEND_INTEGRATION_GUIDE.md** - How to use API service in React components
- **FRONTEND_BACKEND_INTEGRATION_SETUP.md** - This file

---

## Next Steps

1. ✅ Create API service (DONE)
2. ✅ Create auth context (DONE)
3. ✅ Create utilities (DONE)
4. ✅ Update HTML files (DONE)
5. ⏳ Update JSX components to use new API service
6. ⏳ Test full flow end-to-end
7. ⏳ Integrate Stripe for payments
8. ⏳ Add WebSocket for real-time updates

