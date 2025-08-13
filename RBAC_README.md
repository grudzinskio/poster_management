# RBAC System Documentation

## Overview

This project now implements a simplified Role-Based Access Control (RBAC) system as requested. The system provides:

- Simple database structure with 5 core tables
- Easy permission checking with `user.can('permission_name')` method
- Clean separation of users, roles, and permissions
- Comprehensive API for managing users and permissions

## Database Structure

### Core Tables

1. **`users`** - User login information
   - `id` (Primary Key)
   - `username` (Unique)
   - `password` (Hashed)
   - `email`
   - `company_id` (Foreign Key to companies)

2. **`roles`** - Role definitions
   - `id` (Primary Key)
   - `name` (Unique role name)
   - `description`

3. **`permissions`** - Permission definitions
   - `id` (Primary Key)
   - `permission` (Unique permission name)
   - `description`

4. **`user_roles`** - Junction table linking users to roles
   - `id` (Primary Key)
   - `user` (Foreign Key to users.id)
   - `role` (Foreign Key to roles.id)

5. **`role_permissions`** - Junction table linking roles to permissions
   - `id` (Primary Key)
   - `role` (Foreign Key to roles.id)
   - `permission` (Foreign Key to permissions.id)

## Usage Examples

### Basic Permission Checking

```javascript
const { getUserByUsername } = require('./services/userService');

// Get user instance
const user = await getUserByUsername('john_employee');

// Check specific permission
const canEdit = await user.can('edit_user');
console.log(canEdit); // true or false

// Check multiple permissions
const permissions = await user.canMultiple(['edit_user', 'create_campaign']);
console.log(permissions); // { edit_user: true, create_campaign: false }

// Check if user has ANY of the permissions
const hasAny = await user.canAny(['edit_user', 'delete_user']);
console.log(hasAny); // true if user has either permission

// Check if user has ALL permissions
const hasAll = await user.canAll(['view_campaigns', 'edit_campaigns']);
console.log(hasAll); // true only if user has both permissions
```

### Using in Express Routes

```javascript
const { authenticateToken, requirePermission } = require('./middleware/enhancedAuth');

// Protect route with permission requirement
router.get('/users', 
  authenticateToken, 
  requirePermission('view_users'), 
  (req, res) => {
    // This code only runs if user has 'view_users' permission
    // req.userInstance contains the enhanced User object
    res.json({ message: 'User list', user: req.userInstance.username });
  }
);

// Multiple permission requirements
router.post('/admin-action',
  authenticateToken,
  requireAllPermissions(['manage_roles', 'edit_user']),
  (req, res) => {
    // User must have BOTH permissions
    res.json({ message: 'Admin action completed' });
  }
);
```

### Direct Permission Checking

```javascript
const { can } = require('./services/authService');

// Direct permission check by user ID
const userCanEdit = await can(userId, 'edit_user');
console.log(userCanEdit); // true or false
```

## Test Users Created

The system comes with pre-configured test users:

1. **admin** (super_admin role)
   - Username: `admin`
   - Password: `password123`
   - Permissions: All permissions

2. **acme_admin** (company_admin role)
   - Username: `acme_admin`
   - Password: `password123`
   - Permissions: Company and user management

3. **john_employee** (employee role)
   - Username: `john_employee`
   - Password: `password123`
   - Permissions: Basic campaign access

4. **jane_client** (client role)
   - Username: `jane_client`
   - Password: `password123`
   - Permissions: View-only access

5. **bob_contractor** (contractor role)
   - Username: `bob_contractor`
   - Password: `password123`
   - Permissions: Campaign work

## Available Permissions

- `view_users` - View user list and details
- `create_user` - Create new users
- `edit_user` - Edit user information
- `delete_user` - Delete users
- `view_campaigns` - View campaign list and details
- `create_campaign` - Create new campaigns
- `edit_campaign` - Edit campaign information
- `delete_campaign` - Delete campaigns
- `approve_campaign` - Approve or reject campaigns
- `assign_campaign` - Assign campaigns to contractors
- `view_companies` - View company list and details
- `create_company` - Create new companies
- `edit_company` - Edit company information
- `delete_company` - Delete companies
- `manage_roles` - Manage user roles and permissions
- `view_reports` - View system reports and analytics

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/check-permission` - Check specific permission

### RBAC Management
- `GET /api/rbac/me` - Get current user's permissions and roles
- `POST /api/rbac/check` - Check specific permission for current user
- `GET /api/rbac/users` - Get all users (requires `view_users`)
- `POST /api/rbac/users` - Create new user (requires `create_user`)
- `POST /api/rbac/users/:userId/roles` - Assign role (requires `manage_roles`)
- `DELETE /api/rbac/users/:userId/roles/:role` - Remove role (requires `manage_roles`)
- `GET /api/rbac/roles` - Get all roles and permissions

### Example Protected Routes
- `GET /api/rbac/admin-only` - Super admin only
- `GET /api/rbac/management` - Management permissions required
- `GET /api/rbac/campaigns` - Campaign view permission required

## Testing the System

Run the test script to see the RBAC system in action:

```bash
node test-rbac.js
```

This will show how different users have different permissions based on their roles.

## Key Features

1. **Simple Structure** - Only 5 tables as requested
2. **Easy Permission Checking** - `user.can('permission_name')` returns true/false
3. **Flexible Middleware** - Multiple ways to protect routes
4. **Enhanced User Object** - Rich User class with permission methods
5. **Backward Compatibility** - Maintains existing API structure where possible
6. **Comprehensive Testing** - Built-in test script and sample data

## Migration from Old System

The system automatically:
- Drops old complex RBAC tables
- Creates new simplified structure
- Populates with test data
- Maintains user login functionality
- Provides migration path for existing applications

## Security Features

- Bcrypt password hashing
- JWT token authentication
- Permission-based route protection
- Role-based access control
- Secure session management
