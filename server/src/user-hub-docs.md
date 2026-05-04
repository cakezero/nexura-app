# User Hub Route Documentation

## Overview

The User Hub route (`/user-hub`) provides authentication and hub management functionality for individual creators/educators who want to create and manage their own learning platforms. This is distinct from the standard `hub` route which is for organizational studios.

**Base URL:** `/user-hub`

---

## Authentication

### Public Routes (No Authentication Required)

#### 1. Sign Up
- **Endpoint:** `POST /user-hub/sign-up`
- **Description:** Create a new user hub admin account
- **Required Data:**
  ```json
  {
    "name": "string (required)", // this is going to be the user's nexura username
    "email": "string (required, unique, will be lowercased)",
    "password": "string (required)"
  }
  ```
- **Response:**
  - **Success (201 CREATED):** `{ "message": "user hub admin created", "accessToken": "string" }`
  - **Error (400 BAD_REQUEST):** `{ "error": "An account with this email already exists. Please sign in instead." }`
- **Cookies Set:** `userHubRefreshToken` (httpOnly, secure, 30-day expiry)
- **Notes:**
  - Email is automatically trimmed and lowercased
  - Password is hashed before storage
  - Returns JWT access token for immediate authentication

#### 2. Sign In
- **Endpoint:** `POST /user-hub/sign-in`
- **Description:** Authenticate an existing user hub admin
- **Required Data:**
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response:**
  - **Success (200 OK):** `{ "message": "user hub admin logged in", "accessToken": "string" }`
  - **Error (400 BAD_REQUEST):** `{ "error": "Invalid email or password" }`
- **Cookies Set:** `userHubRefreshToken` (httpOnly, secure, 30-day expiry)

#### 3. Forgot Password
- **Endpoint:** `POST /user-hub/forgot-password`
- **Description:** Request a password reset email
- **Required Data:**
  ```json
  {
    "email": "string (required)"
  }
  ```
- **Response:**
  - **Success (200 OK):** `{ "message": "Reset link sent to your email" }`
  - **Error (404 NOT_FOUND):** `{ "error": "Email not found" }`

#### 4. Reset Password
- **Endpoint:** `POST /user-hub/reset-password`
- **Description:** Reset password using a token from the forgot password email
- **Required Data:**
  ```json
  {
    "token": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response:**
  - **Success (200 OK):** `{ "message": "Password reset successfully" }`
  - **Error (400 BAD_REQUEST):** `{ "error": "Invalid or expired token" }`

---

## Authenticated Routes

All routes below require the `authenticateUserHub` middleware. Users must include their JWT token in the `Authorization` header or have a valid `userHubRefreshToken` cookie.

### Hub Management

#### 1. Create User Hub
- **Endpoint:** `POST /user-hub/create-user-hub`
- **Description:** Create a new user hub (platform/workspace) for the authenticated admin
- **Authentication:** Required
- **Required Data:**
  ```json
  {
    "name": "string (required, must be unique)", // nexura username
    "description": "string (required)",
    "website": "string (optional)",
    "xAccount": "string (optional)",
    "pfp": "string (optional, profile picture URL or data)" // nexura pfp, they should not be able to change this through the ui unless through the profile page
  }
  ```
- **Response:**
  - **Success (201 CREATED):** `{ "message": "user hub created!" }`
  - **Error (400 BAD_REQUEST):** 
    - `{ "error": "these field(s) are required: ..." }` - Missing required fields
    - `{ "error": "name is already in use" }` - Duplicate name
- **Data Structure (Stored):**
  ```typescript
  {
    _id: ObjectId,
    name: string,
    logo: string,
    description: string,
    website: string,
    xAccount: string,
    questsCreated: number (default: 0),
    noOfPayments: number (default: 0),
    superAdmin: ObjectId (reference to userHubAdmin),
    pendingTxHash: string | null,
    createdAt: Date,
    updatedAt: Date
  }
  ```
- **Notes:**
  - The authenticated admin becomes the `superAdmin` of the hub
  - Any pending payment hash from the admin account is migrated to the hub
  - Name must be unique across all user hubs

#### 2. Logout
- **Endpoint:** `POST /user-hub/logout`
- **Description:** Logout the authenticated user hub admin
- **Authentication:** Required
- **Required Data:** None
- **Response:**
  - **Success (200 OK):** `{ "message": "user hub admin logged out!" }`
- **Side Effects:**
  - Clears `userHubRefreshToken` cookie
  - Token is added to Redis blacklist with 7-day TTL to prevent reuse

---

### Lesson Management

#### 1. Create Lesson
- **Endpoint:** `POST /user-hub/create-lesson`
- **Description:** Create a new lesson within the user hub
- **Authentication:** Required
- **Required Data:** use same data as before
- **File Upload:** Yes (optional)
- **Response:** Varies based on lesson controller implementation

#### 2. Update Lesson
- **Endpoint:** `PATCH /user-hub/update-lesson`
- **Description:** Update an existing lesson
- **Authentication:** Required
- **Required Data:** Lesson ID and fields to update

#### 3. Delete Lesson
- **Endpoint:** `DELETE /user-hub/delete-lesson`
- **Description:** Delete a lesson
- **Authentication:** Required
- **Required Data:** Lesson ID

#### 4. Create Mini Lesson
- **Endpoint:** `POST /user-hub/create-mini-lesson`
- **Description:** Create a mini lesson (sub-lesson)
- **Authentication:** Required

#### 5. Update Mini Lesson
- **Endpoint:** `PATCH /user-hub/update-mini-lesson`
- **Description:** Update a mini lesson
- **Authentication:** Required

#### 6. Delete Mini Lesson
- **Endpoint:** `DELETE /user-hub/delete-mini-lesson`
- **Description:** Delete a mini lesson
- **Authentication:** Required

#### 7. Publish Lesson
- **Endpoint:** `POST /user-hub/publish-lesson`
- **Description:** Publish a lesson to make it publicly available
- **Authentication:** Required

#### 8. Unpublish Lesson
- **Endpoint:** `POST /user-hub/unpublish-lesson`
- **Description:** Unpublish a lesson (make it private)
- **Authentication:** Required

---

### Question Management

#### 1. Create Question
- **Endpoint:** `POST /user-hub/create-question`
- **Description:** Create a question (likely part of a lesson)
- **Authentication:** Required

#### 2. Update Question
- **Endpoint:** `PATCH /user-hub/update-question`
- **Description:** Update a question
- **Authentication:** Required

#### 3. Delete Question
- **Endpoint:** `DELETE /user-hub/delete-question`
- **Description:** Delete a question
- **Authentication:** Required

---

### Quest Management

#### 1. Create Quest
- **Endpoint:** `POST /user-hub/create-quest`
- **Description:** Create a new quest within the user hub
- **Authentication:** Required
- **Required Data:** See quest controller documentation

#### 2. Save Quest
- **Endpoint:** `POST /user-hub/save-quest`
- **Description:** Save/update a quest
- **Authentication:** Required

#### 3. Save Mini Quest
- **Endpoint:** `POST /user-hub/save-mini-quest`
- **Description:** Create and save a mini quest (sub-quest)
- **Authentication:** Required

#### 4. Delete Quest
- **Endpoint:** `DELETE /user-hub/delete-quest`
- **Description:** Delete a quest
- **Authentication:** Required

#### 5. Delete Mini Quest
- **Endpoint:** `DELETE /user-hub/delete-mini-quest`
- **Description:** Delete a mini quest
- **Authentication:** Required

---

## Data Models

### User Hub Admin
```typescript
{
  _id: ObjectId,
  email: string (unique, lowercased),
  password: string (hashed),
  name: string,
  hub: ObjectId (reference to userHub, optional),
  createdAt: Date,
  updatedAt: Date
}
```

### User Hub
```typescript
{
  _id: ObjectId,
  systemKey: string (unique, optional),
  name: string (unique, required),
  logo: string (required),
  description: string (default: ""),
  website: string (default: ""),
  xAccount: string (default: ""),
  questsCreated: number (default: 0),
  noOfPayments: number (default: 0),
  superAdmin: ObjectId (reference to userHubAdmin),
  pendingTxHash: string | null (default: null),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Error Handling

### HTTP Status Codes
- **200 OK** - Successful request
- **201 CREATED** - Resource successfully created
- **400 BAD_REQUEST** - Invalid input data or validation error
- **401 UNAUTHORIZED** - Missing or invalid authentication token
- **403 FORBIDDEN** - User does not have permission to perform action
- **404 NOT_FOUND** - Resource not found
- **500 INTERNAL_SERVER_ERROR** - Server error

### Common Errors
1. **Missing Required Fields:** `{ "error": "these field(s) are required: field1, field2" }`
2. **Duplicate Email/Name:** `{ "error": "An account with this email already exists" }` or `{ "error": "name is already in use" }`
3. **Invalid Credentials:** `{ "error": "Invalid email or password" }`
4. **Unauthenticated:** Redirected or rejected with 401 status
5. **Server Error:** `{ "error": "Error creating user hub" }`

---

## Authentication Flow

### Sign Up Flow
1. POST `/user-hub/sign-up` with credentials
2. Server creates userHubAdmin record with hashed password
3. Server generates JWT access token
4. Server sets refresh token in httpOnly cookie
5. Client receives access token and stores for API calls

### Sign In Flow
1. POST `/user-hub/sign-in` with email and password
2. Server validates credentials against stored hash
3. Server generates new JWT access token
4. Server sets refresh token in httpOnly cookie
5. Client receives access token

### Logout Flow
1. POST `/user-hub/logout` (requires authentication)
2. Server adds token to Redis blacklist
3. Server clears refresh token cookie
4. Client clears local storage

### Protected Route Access
1. Client sends GET/POST/PATCH/DELETE request with JWT in `Authorization` header
2. `authenticateUserHub` middleware validates token
3. If valid, request proceeds with `req.id` (admin ID) available
4. If invalid/expired, request is rejected with 401

---

## Best Practices

1. **Always use HTTPS** - Tokens are transmitted in cookies and headers
2. **Store tokens securely** - Keep access tokens in memory, refresh tokens in httpOnly cookies
3. **Handle token expiry** - Implement refresh token rotation
4. **Validate input** - All required fields must be provided
5. **Check for duplicates** - Hub names must be unique
6. **Use proper HTTP methods** - POST for creation, PATCH for updates, DELETE for deletion
7. **Include authentication headers** - `Authorization: Bearer <token>`

---

## Example Usage

### Sign Up
```bash
curl -X POST http://localhost:3000/user-hub/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Creator",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Create User Hub
```bash
curl -X POST http://localhost:3000/user-hub/create-user-hub \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Learning Platform",
    "description": "A platform for teaching web development",
    "website": "https://myplatform.com",
    "xAccount": "@myplatform"
  }'
```

### Create Quest
```bash
curl -X POST http://localhost:3000/user-hub/create-quest \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a Todo App",
    "description": "Learn by building a todo application",
    "reward": 100,
    "xp": 50
  }'
```

---

## Notes

- The user-hub route is specifically for individual creators, distinct from the organizational `hub` route
- All lesson and quest creation within user-hubs follows similar patterns to organizational hubs
- User hubs can accumulate payment hashes for on-chain fees
- The `questsCreated` counter tracks the number of quests created in the hub
- Payment functionality is linked via the `pendingTxHash` and `noOfPayments` fields
