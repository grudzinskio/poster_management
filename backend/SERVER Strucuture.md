# Backend Architecture Documentation

## Overview

The backend has been refactored from a single 781-line `server.js` file into a modular architecture for better maintainability, testability, and scalability.

## Directory Structure

```
backend/
├── server.js                 # Main application entry point (40 lines)
├── server-backup.js          # Backup of original server.js
├── config/
│   └── database.js           # Database configuration and connection pool
├── middleware/
│   ├── auth.js              # Authentication & authorization middleware
│   └── index.js             # Middleware exports
├── routes/
│   ├── auth.js              # Authentication routes (/api/login, /api/migrate-passwords)
│   ├── companies.js         # Company CRUD routes (/api/companies/*)
│   ├── users.js             # User management routes (/api/users/*)
│   ├── campaigns.js         # Campaign management routes (/api/campaigns/*)
│   └── index.js             # Route aggregator
├── controllers/
│   ├── authController.js    # Authentication business logic
│   ├── companyController.js # Company business logic
│   ├── userController.js    # User business logic
│   └── campaignController.js # Campaign business logic
├── services/
│   └── authService.js       # Password hashing, JWT operations
└── utils/
    ├── errorHandler.js      # Centralized error handling
    └── responseHelper.js    # Standard response formatting
```

## Key Improvements

### 1. **Separation of Concerns**

- **Controllers**: Handle business logic and request/response processing
- **Services**: Reusable business logic (password hashing, JWT operations)
- **Routes**: Define API endpoints and middleware
- **Middleware**: Authentication, authorization, and other cross-cutting concerns
- **Config**: Database and environment configuration

### 2. **Code Reduction**

- Main `server.js`: **781 lines → 40 lines** (95% reduction)
- Modular components: Each file handles a specific responsibility
- Reusable services eliminate code duplication

### 3. **Maintainability**

- Easy to locate and modify specific functionality
- Clear dependencies between modules
- Consistent error handling across all routes

### 4. **Testability**

- Individual controllers and services can be unit tested
- Middleware can be tested in isolation
- Database logic is separated from HTTP logic

### 5. **Scalability**

- Easy to add new features without modifying existing files
- Consistent patterns for new routes and controllers
- Modular architecture supports team development

## API Endpoints

All endpoints remain exactly the same as before:

### Authentication

- `POST /api/login` - User authentication
- `POST /api/migrate-passwords` - Migrate plaintext passwords (Employee only)

### Companies (Employee only)

- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Users (Employee only)

- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update user password
- `DELETE /api/users/:id` - Delete user

### Campaigns

- `GET /api/campaigns` - List campaigns (role-based filtering)
- `POST /api/campaigns` - Create campaign (Client/Employee)
- `PUT /api/campaigns/:id` - Update campaign (Employee only)
- `PUT /api/campaigns/:id/status` - Update campaign status (Employee only)

## Usage

The refactored backend maintains 100% API compatibility. No changes are needed in the frontend or any API clients.

### Starting the Server

```bash
cd backend
node server.js
```

### Development

- Modify specific functionality in the appropriate controller
- Add new routes in the routes directory
- Add reusable logic in services
- Use the error handler and response helper utilities for consistency

## Migration Notes

- Original `server.js` backed up as `server-backup.js`
- All functionality preserved with identical API behavior
- Database connections and authentication remain unchanged
- Environment variables and configuration unchanged
