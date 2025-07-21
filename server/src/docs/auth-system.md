# Authentication System Documentation

## Overview

This document provides an overview of the authentication system implemented in the Attendance System backend. The system uses JWT (JSON Web Tokens) for authentication and supports role-based access control.

## Components

### 1. Authentication Service (`authService.js`)

The authentication service handles user authentication, token generation, and user management.

**Key Functions:**

- `login(username, password)`: Authenticates a user and generates a JWT token
- `getUserById(userId)`: Retrieves user information by ID
- `changePassword(userId, currentPassword, newPassword)`: Updates a user's password

### 2. Authentication Middleware (`authMiddleware.js`)

The middleware provides functions to protect routes and enforce authentication and authorization.

**Key Functions:**

- `authenticate`: Verifies JWT tokens and adds user data to the request
- `authorize(roles)`: Checks if the authenticated user has the required role(s)

### 3. Authentication Routes (`authRoutes.js`)

The routes define the API endpoints for authentication-related operations.

**Endpoints:**

- `POST /api/auth/login`: Authenticates a user and returns a token
- `GET /api/auth/me`: Returns the current user's information
- `PUT /api/auth/change-password`: Updates the user's password
- `GET /api/auth/check`: Verifies if the user is authenticated

## User Schema

The users table has the following structure:

| Field | Type | Description |
|-------|------|-------------|
| id | NVARCHAR | Unique identifier |
| username | NVARCHAR | User's username |
| password | NVARCHAR | Hashed password |
| role | NVARCHAR | User's role (admin, user, support) |
| approved | BIT | Whether the user is approved |
| authentication_type | VARCHAR | Authentication type (local, ldap) |

## Authentication Flow

1. User submits credentials (username/password)
2. Server validates credentials against the database
3. If valid, server generates a JWT token containing user information
4. Token is returned to the client
5. Client includes token in Authorization header for subsequent requests
6. Server validates token and grants access to protected resources

## Role-Based Access Control

The system supports role-based access control with the following roles:

- `admin`: Full access to all features
- `user`: Limited access to basic features
- `support`: Access to support-related features

## Utility Scripts

### Create Test User (`createTestUser.js`)

Creates a test user and admin user for testing purposes.

```
Username: testuser
Password: password123
Role: user
```

```
Username: admin
Password: admin123
Role: admin
```

### Reset Admin Password (`resetAdminPassword.js`)

Resets the admin password to the default value.

```
Username: admin
Password: admin123
```

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Authentication type is verified to prevent unauthorized access
- User approval status is checked during login