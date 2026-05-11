# Campus Connect API Documentation

**Base URL:** `http://localhost:4000` (development)

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Events](#events)
4. [Event Registrations](#event-registrations)
5. [Admin](#admin)
6. [Payments](#payments)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Send OTP

**Endpoint:** `POST /api/auth/otp/send`

**Rate Limit:** 8 requests per 10 minutes

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification code sent.",
  "providerMessageId": "email-provider-id-or-null"
}
```

**Errors:**
- `400` - Invalid email format
- `500` - Could not send verification code

---

### Verify OTP

**Endpoint:** `POST /api/auth/otp/verify`

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified.",
  "signupProofToken": "jwt-token-for-signup"
}
```

**Errors:**
- `400` - Invalid email/code format or no active challenge
- `429` - Too many incorrect attempts (5 max)

---

### Register User

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "signupProofToken": "jwt-token-from-otp-verify",
  "accountType": "Student",
  "firstName": "John",
  "lastName": "Doe",
  "regNo": "REG001",
  "department": "Computer Science",
  "programOrUnit": "Bachelor of Science",
  "yearOrDesignation": "2nd Year",
  "email": "user@example.com",
  "username": "johndoe123",
  "password": "SecurePassword123"
}
```

**Query Parameters:**
- `signupProofToken` (required if `REQUIRE_EMAIL_OTP=true`) - Token from OTP verification

**Response (201):**
```json
{
  "message": "Account created successfully.",
  "token": "session-jwt-token"
}
```

**Errors:**
- `400` - Missing fields or invalid format
- `409` - Email or username already exists

---

### Sign In

**Endpoint:** `POST /api/auth/signin`

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Signed in successfully.",
  "token": "session-jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe123",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "Student"
  }
}
```

**Errors:**
- `400` - Invalid credentials format
- `401` - Invalid email or password

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe123",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "Student"
  }
}
```

**Errors:**
- `401` - Unauthorized or session expired

---

### Admin Login

**Endpoint:** `POST /api/admin/login`

**Rate Limit:** 60 requests per 10 minutes

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin-password"
}
```

**Response (200):**
```json
{
  "token": "admin-jwt-token",
  "email": "admin@example.com"
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials

---

## User Profile

### Get User Profile

**Endpoint:** `GET /api/profile`

**Authentication:** Required (Bearer token)

**Rate Limit:** 40 requests per 10 minutes

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "accountType": "Student",
    "firstName": "John",
    "lastName": "Doe",
    "regNo": "REG001",
    "department": "Computer Science",
    "programOrUnit": "Bachelor of Science",
    "yearOrDesignation": "2nd Year",
    "email": "user@example.com",
    "username": "johndoe123",
    "createdAt": 1621234567890
  }
}
```

**Errors:**
- `401` - Unauthorized

---

### Update User Profile

**Endpoint:** `PATCH /api/profile`

**Authentication:** Required (Bearer token)

**Rate Limit:** 40 requests per 10 minutes

**Request Body (all optional):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "department": "Computer Science",
  "programOrUnit": "Bachelor of Science",
  "yearOrDesignation": "2nd Year"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully."
}
```

**Errors:**
- `400` - No fields to update
- `401` - Unauthorized

---

## Events

### List Events

**Endpoint:** `GET /api/events`

**Query Parameters:**
- `department` (optional) - Filter by department (default: "All")
- `eventType` (optional) - Filter by event type (default: "All")

**Response (200):**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Hackathon 2024",
      "eventType": "Hackathon",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "location": "Main Auditorium",
      "description": "24-hour coding competition",
      "price": "Free",
      "maxTeamSize": 4,
      "posterImage": "data:image/png;base64,...",
      "image": "data:image/png;base64,...",
      "approvalStatus": "Approved",
      "createdBy": "organizer1",
      "createdAt": 1621234567890
    }
  ]
}
```

---

### Get Event Details

**Endpoint:** `GET /api/events/:id`

**URL Parameters:**
- `id` (required) - Event ID

**Response (200):**
```json
{
  "event": {
    "id": 1,
    "title": "Hackathon 2024",
    "eventType": "Hackathon",
    "department": "Computer Science",
    "date": "2024-12-15",
    "time": "09:00",
    "location": "Main Auditorium",
    "description": "24-hour coding competition",
    "price": "Free",
    "maxTeamSize": 4,
    "posterImage": "data:image/png;base64,...",
    "image": "data:image/png;base64,...",
    "approvalStatus": "Approved",
    "createdBy": "organizer1",
    "createdAt": 1621234567890,
    "registrations": 25
  }
}
```

**Errors:**
- `400` - Invalid event id
- `404` - Event not found

---

### Create Event

**Endpoint:** `POST /api/events`

**Authentication:** Required (Organizer account)

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "title": "Hackathon 2024",
  "eventType": "Hackathon",
  "department": "Computer Science",
  "date": "2024-12-15",
  "time": "09:00",
  "location": "Main Auditorium",
  "description": "24-hour coding competition",
  "eventPrice": "Free",
  "maxTeamSize": 4,
  "posterImage": "data:image/png;base64,..."
}
```

**Response (201):**
```json
{
  "message": "Event created successfully."
}
```

**Errors:**
- `400` - Missing required fields or invalid image
- `401` - Unauthorized
- `403` - Only organizers can create events

---

### Update Event

**Endpoint:** `PATCH /api/organizer/events/:id`

**Authentication:** Required (Organizer account)

**Rate Limit:** 40 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Request Body:**
```json
{
  "title": "Hackathon 2024",
  "eventType": "Hackathon",
  "department": "Computer Science",
  "date": "2024-12-15",
  "time": "09:00",
  "location": "Main Auditorium",
  "description": "24-hour coding competition",
  "eventPrice": "Free",
  "maxTeamSize": 4,
  "posterImage": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "message": "Event updated successfully. Status moved to Pending for review."
}
```

**Errors:**
- `400` - No changes detected or invalid data
- `401` - Unauthorized
- `404` - Event not found

---

### Get Organizer's Events

**Endpoint:** `GET /api/organizer/events`

**Authentication:** Required (Organizer account)

**Response (200):**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Hackathon 2024",
      "eventType": "Hackathon",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "location": "Main Auditorium",
      "description": "24-hour coding competition",
      "maxTeamSize": 4,
      "posterImage": "data:image/png;base64,...",
      "image": "data:image/png;base64,...",
      "approvalStatus": "Pending",
      "price": "Free",
      "registrationCount": 5,
      "createdBy": "organizer1",
      "createdAt": 1621234567890
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Only organizers can access

---

### Request Event Deletion

**Endpoint:** `POST /api/organizer/events/:id/delete-request`

**Authentication:** Required (Organizer account)

**Rate Limit:** 40 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Request Body:**
```json
{
  "reason": "Event cancelled due to venue unavailability"
}
```

**Response (200):**
```json
{
  "message": "Deletion request submitted for admin approval."
}
```

**Errors:**
- `400` - Reason too short or only approved events can be deleted
- `401` - Unauthorized
- `404` - Event not found
- `409` - Deletion request already pending

---

### Get Event Registrations (Organizer)

**Endpoint:** `GET /api/organizer/events/:id/registrations`

**Authentication:** Required (Organizer account)

**Rate Limit:** 40 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Response (200):**
```json
{
  "event": {
    "id": 1,
    "title": "Hackathon 2024"
  },
  "count": 5,
  "registrations": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 2,
      "fullName": "Alice Smith",
      "email": "alice@example.com",
      "phone": "+1234567890",
      "yearOrDesignation": "2nd Year",
      "notes": "Looking forward to it",
      "pricingLabel": "Free Entry",
      "paymentPath": null,
      "createdAt": 1621234567890
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Only organizers can access
- `404` - Event not found

---

## Event Registrations

### Register for Event

**Endpoint:** `POST /api/events/:id/register`

**Authentication:** Required (Student account)

**Rate Limit:** 40 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "year": "2nd Year",
  "teamSize": 2,
  "additionalMembers": [
    {
      "name": "Jane Smith",
      "regNo": "REG002"
    }
  ],
  "notes": "Excited to participate",
  "pricingLabel": "Free Entry",
  "paymentPath": ""
}
```

**Response (201):**
```json
{
  "message": "Registration successful.",
  "registration": {
    "id": 1,
    "eventId": 1,
    "eventTitle": "Hackathon 2024",
    "paymentPath": null
  }
}
```

**Errors:**
- `400` - Missing required fields or invalid data
- `401` - Unauthorized
- `403` - Only students can register
- `404` - Event not found
- `409` - Already registered
- `410` - Cannot register for past events

---

### Get My Registrations

**Endpoint:** `GET /api/me/registrations`

**Authentication:** Required (Student account)

**Rate Limit:** 40 requests per 10 minutes

**Response (200):**
```json
{
  "count": 2,
  "registrations": [
    {
      "id": 1,
      "eventId": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "yearOrDesignation": "2nd Year",
      "notes": "Excited to participate",
      "pricingLabel": "Free Entry",
      "paymentPath": null,
      "createdAt": 1621234567890,
      "eventTitle": "Hackathon 2024",
      "eventType": "Hackathon",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "location": "Main Auditorium",
      "posterImage": "data:image/png;base64,...",
      "image": "data:image/png;base64,..."
    }
  ]
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Only students can access

---

### Cancel Registration

**Endpoint:** `DELETE /api/me/registrations/:id`

**Authentication:** Required (Student account)

**Rate Limit:** 40 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Registration ID

**Response (200):**
```json
{
  "message": "Registration cancelled successfully."
}
```

**Errors:**
- `400` - Invalid registration id
- `401` - Unauthorized
- `403` - Can only cancel your own registrations
- `404` - Registration not found
- `410` - Cannot cancel registration for events that have started

---

## Admin

### Get All Users

**Endpoint:** `GET /api/admin/users`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**Response (200):**
```json
{
  "count": 10,
  "users": [
    {
      "id": 1,
      "accountType": "Student",
      "firstName": "John",
      "lastName": "Doe",
      "regNo": "REG001",
      "department": "Computer Science",
      "programOrUnit": "Bachelor of Science",
      "yearOrDesignation": "2nd Year",
      "email": "john@example.com",
      "username": "johndoe123",
      "createdAt": 1621234567890
    }
  ]
}
```

**Errors:**
- `403` - Admin access denied
- `500` - Server error

---

### Get All Events (Admin)

**Endpoint:** `GET /api/admin/events`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**Query Parameters:**
- `status` (optional) - Filter by approval status ("Pending", "Approved", "Rejected")

**Response (200):**
```json
{
  "count": 5,
  "events": [
    {
      "id": 1,
      "title": "Hackathon 2024",
      "eventType": "Hackathon",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "location": "Main Auditorium",
      "description": "24-hour coding competition",
      "price": "Free",
      "maxTeamSize": 4,
      "posterImage": "data:image/png;base64,...",
      "image": "data:image/png;base64,...",
      "approvalStatus": "Pending",
      "editChangeSummary": null,
      "editRequestedAt": null,
      "deleteRequestReason": null,
      "deleteRequestedAt": null,
      "organizerId": 2,
      "createdBy": "organizer1",
      "createdAt": 1621234567890,
      "registrationCount": 5
    }
  ]
}
```

**Errors:**
- `403` - Admin access denied

---

### Get Deletion Requests

**Endpoint:** `GET /api/admin/events/deletion-requests`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**Response (200):**
```json
{
  "count": 2,
  "events": [
    {
      "id": 1,
      "title": "Hackathon 2024",
      "eventType": "Hackathon",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "location": "Main Auditorium",
      "description": "24-hour coding competition",
      "price": "Free",
      "maxTeamSize": 4,
      "approvalStatus": "Approved",
      "deleteRequestReason": "Event cancelled due to venue unavailability",
      "deleteRequestedAt": 1621234567890,
      "createdBy": "organizer1",
      "createdAt": 1621234567890,
      "registrationCount": 5
    }
  ]
}
```

**Errors:**
- `403` - Admin access denied

---

### Get All Registrations (Admin)

**Endpoint:** `GET /api/admin/registrations`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**Query Parameters:**
- `limit` (optional) - Max registrations to return (1-500, default: 100)

**Response (200):**
```json
{
  "count": 25,
  "registrations": [
    {
      "id": 1,
      "eventId": 1,
      "userId": 2,
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "yearOrDesignation": "2nd Year",
      "notes": "Excited to participate",
      "pricingLabel": "Free Entry",
      "paymentPath": null,
      "createdAt": 1621234567890,
      "eventTitle": "Hackathon 2024",
      "department": "Computer Science",
      "date": "2024-12-15",
      "time": "09:00",
      "organizerUsername": "organizer1"
    }
  ]
}
```

**Errors:**
- `403` - Admin access denied

---

### Approve Event

**Endpoint:** `PATCH /api/admin/events/:id/approve`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Response (200):**
```json
{
  "message": "Event approved successfully."
}
```

**Errors:**
- `400` - Invalid event id
- `403` - Admin access denied
- `404` - Event not found

---

### Approve Event Deletion

**Endpoint:** `PATCH /api/admin/events/:id/approve-delete`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**URL Parameters:**
- `id` (required) - Event ID

**Response (200):**
```json
{
  "message": "Event deleted after admin approval."
}
```

**Errors:**
- `400` - Invalid event id or no pending deletion request
- `403` - Admin access denied
- `404` - Event not found

---

### Get Admin Dashboard Statistics

**Endpoint:** `GET /api/admin/stats`

**Authentication:** Required (Admin account)

**Rate Limit:** 60 requests per 10 minutes

**Response (200):**
```json
{
  "users": {
    "total": 50,
    "students": 40,
    "organizers": 10
  },
  "events": {
    "total": 15,
    "approved": 10,
    "pending": 3,
    "rejected": 1,
    "deletionRequests": 1,
    "byDepartment": [
      {
        "department": "Computer Science",
        "count": 8
      }
    ],
    "byType": [
      {
        "eventType": "Hackathon",
        "count": 3
      }
    ]
  },
  "registrations": {
    "total": 150,
    "byStatus": [
      {
        "status": "Approved",
        "count": 150
      }
    ]
  },
  "recentEvents": [
    {
      "id": 1,
      "title": "Hackathon 2024",
      "eventType": "Hackathon",
      "approvalStatus": "Approved",
      "createdAt": 1621234567890,
      "registrationCount": 25
    }
  ]
}
```

**Errors:**
- `403` - Admin access denied

---

## Payments

### Create Payment Intent

**Endpoint:** `POST /api/payments/create-intent`

**Authentication:** Required (Bearer token)

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "amount": 999,
  "currency": "USD",
  "eventId": 1,
  "description": "Registration fee for Hackathon 2024"
}
```

**Response (200):**
```json
{
  "paymentIntentId": "pi_1234567890_abc123",
  "amount": 999,
  "currency": "USD",
  "status": "requires_payment_method",
  "clientSecret": "pi_1234567890_secret_abc123",
  "message": "Payment intent created successfully."
}
```

**Errors:**
- `400` - Missing or invalid parameters
- `401` - Unauthorized
- `404` - Event not found

**Note:** This is a skeleton implementation. Stripe integration is required for actual payments.

---

### Confirm Payment

**Endpoint:** `POST /api/payments/confirm`

**Authentication:** Required (Bearer token)

**Rate Limit:** 40 requests per 10 minutes

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890_abc123",
  "registrationId": 1
}
```

**Response (200):**
```json
{
  "message": "Payment confirmed successfully.",
  "registration": {
    "id": 1,
    "eventId": 1,
    "paymentPath": "pi_1234567890_abc123"
  }
}
```

**Errors:**
- `400` - Missing parameters
- `401` - Unauthorized
- `404` - Registration not found

**Note:** This is a skeleton implementation. Stripe verification is required for actual payments.

---

## Error Handling

### Standard Error Response

```json
{
  "message": "Description of the error"
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or missing fields |
| 401 | Unauthorized - Authentication required or invalid |
| 403 | Forbidden - Access denied (insufficient permissions) |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists or conflicting state |
| 410 | Gone - Resource no longer available (e.g., past event) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 502 | Bad Gateway - External service error (e.g., email provider) |
| 503 | Service Unavailable - Feature not configured |

---

## Rate Limiting

Rate limits are applied per IP address and reset after the specified window.

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Global | 250 requests | 15 minutes |
| OTP | 8 requests | 10 minutes |
| Auth (login, register) | 40 requests | 10 minutes |
| Admin | 60 requests | 10 minutes |

When a rate limit is exceeded, the response will be:

```json
{
  "message": "Too many requests. Please slow down."
}
```

---

## Authentication

All endpoints marked as "Authentication: Required" need a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Admin Authentication

Admin endpoints can be accessed with:

1. **Admin JWT Token** (from `/api/admin/login`):
   ```
   Authorization: Bearer <admin-jwt-token>
   ```

2. **Dev Admin Key** (via header):
   ```
   X-Admin-Key: <DEV_ADMIN_KEY>
   ```

---

## Environment Variables

Backend configuration via `.env`:

```
PORT=4000
FRONTEND_ORIGIN=http://127.0.0.1:5500,http://localhost:5500
JWT_SECRET=your-secret-key
JWT_SIGNUP_PROOF_EXPIRY=15m
OTP_EXPIRY_MINUTES=10
OTP_PEPPER=pepper-for-hashing
REQUIRE_EMAIL_OTP=false
DEV_ADMIN_KEY=your-dev-admin-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin-password
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@campus-connect.com
RESEND_AUDIENCE_NAME=Campus Connect
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  account_type TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  reg_no TEXT NOT NULL,
  department TEXT NOT NULL,
  program_or_unit TEXT NOT NULL,
  year_or_designation TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
```

### Events Table
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  department TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  event_price TEXT NOT NULL DEFAULT 'Free',
  max_team_size INTEGER NOT NULL DEFAULT 6,
  poster_image TEXT,
  approval_status TEXT NOT NULL DEFAULT 'Pending',
  edit_change_summary TEXT,
  edit_requested_at BIGINT,
  delete_request_reason TEXT,
  delete_requested_at BIGINT,
  organizer_id INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);
```

### Event Registrations Table
```sql
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  year_or_designation TEXT,
  notes TEXT,
  pricing_label TEXT NOT NULL DEFAULT 'Free Entry',
  payment_path TEXT,
  created_at BIGINT NOT NULL,
  UNIQUE(event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### OTP Challenges Table
```sql
CREATE TABLE otp_challenges (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);
```
