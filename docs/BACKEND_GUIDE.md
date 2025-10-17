# Backend Development Guide

## Overview

This guide outlines the setup, architecture, and standards for backend development in the Task Manager project. The backend is built with Node.js and Express.js, using Supabase for authentication and database operations.

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation Steps
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env`
4. Configure your Supabase credentials in `.env`
5. Start development server: `npm run dev`

### Environment Variables
Required environment variables in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_SUPABASE_KEY
PORT=3001
```

## Architecture

### Technology Stack
- **Node.js** - JavaScript runtime for server-side logic
- **Express.js** - Web framework for RESTful API
- **Supabase** - Backend-as-a-Service for authentication and database
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library for testing

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── supabaseClient.js     # Supabase configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── taskController.js     # Task CRUD operations
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   └── tasks.js              # Task management routes
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication middleware
│   ├── tests/
│   │   ├── controllers/
│   │   │   ├── authController.test.js    # Auth unit tests
│   │   │   └── taskController.test.js    # Task unit tests
│   │   ├── routes/
│   │   │   ├── auth.test.js              # Auth integration tests
│   │   │   └── tasks.test.js             # Task integration tests
│   │   └── setup.js              # Test configuration
│   └── index.js                  # Main server file
├── jest.config.js                # Jest configuration
├── package.json                  # Dependencies and scripts
└── .env.example                  # Environment variables template
```

## Key Components

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Task Management Endpoints
All task endpoints require JWT authentication via Bearer token.

- `GET /api/tasks` - Get all tasks for authenticated user
- `GET /api/tasks/:id` - Get specific task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task

#### Request/Response Format
**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "session": {
    "access_token": "jwt_token",
    "user": {...}
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Controllers

#### authController.js
Handles authentication logic with:
- Input validation (email format, password strength)
- Email normalization (lowercase, trim whitespace)
- Comprehensive error handling
- Supabase Auth integration

#### taskController.js
Manages task CRUD operations with:
- **User Isolation**: All operations automatically scoped to authenticated user
- **Input Validation**: Title required, status validation, parent task verification
- **CRUD Operations**:
  - `createTask`: Create new task with user ownership
  - `getTasks`: Retrieve user's tasks with optional status filter
  - `getTaskById`: Get single task (validates ownership)
  - `updateTask`: Update task fields (validates ownership)
  - `deleteTask`: Remove task (validates ownership)
- **Security**: Prevents cross-user data access
- **Validation**: Status enum, UUID format, circular reference prevention

### Middleware

#### authMiddleware.js
JWT authentication middleware that:
- Extracts Bearer token from Authorization header
- Verifies token with Supabase
- Validates token expiration
- Attaches user information to request object (`req.user`)
- Returns 401 for invalid/missing tokens
- Applied to all `/api/tasks` routes

**Usage Example:**
```javascript
const { authenticateUser } = require('../middleware/authMiddleware');
router.get('/api/tasks', authenticateUser, taskController.getTasks);
```

### Configuration
- **supabaseClient.js** - Centralized Supabase client configuration with environment validation

## Standards

### Code Quality
- Follow consistent coding styles and ESLint rules
- Use meaningful variable and function names
- Implement proper error handling and logging
- Validate all user inputs (email format, password strength)
- Normalize data (lowercase emails, trim whitespace)

### Security

#### Authentication Security
- Password strength validation (minimum 6 characters)
- Email format validation with regex
- Secure JWT token handling via Supabase
- Environment variable validation

#### Task Security & User Isolation
- **Automatic User Scoping**: All task operations filtered by `user_id`
- **JWT Validation**: Every request validated via `authMiddleware`
- **Ownership Verification**: Tasks can only be accessed by their owner
- **No Cross-User Access**: 404 returned for unauthorized access attempts
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **Input Sanitization**: All inputs validated before database operations

#### HTTP Status Codes
- `200 OK` - Successful retrieval/update
- `201 Created` - Successful creation
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource doesn't exist or doesn't belong to user
- `500 Internal Server Error` - Server-side errors

### Error Handling
- Consistent error response format
- Detailed error logging for debugging
- Graceful handling of Supabase errors
- Proper HTTP status code usage

## Integration

### Frontend Integration
- RESTful API endpoints for frontend consumption
- CORS configuration for cross-origin requests
- JSON request/response format
- Proper authentication flow with session management

### Supabase Integration
- Authentication handled through Supabase Auth
- Automatic session management
- JWT token validation
- Database operations through Supabase client

## Testing

### Testing Framework
- **Jest** - Primary testing framework
- **Supertest** - HTTP endpoint testing
- **Mocking** - Supabase client mocked for isolated testing

### Test Scripts
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Test Structure
```
src/tests/
├── controllers/
│   ├── authController.test.js    # Unit tests for auth (10 tests)
│   └── taskController.test.js    # Unit tests for tasks (22 tests)
├── routes/
│   ├── auth.test.js              # Integration tests for auth (9 tests)
│   └── tasks.test.js             # Integration tests for tasks (17 tests)
└── setup.js                      # Test configuration and mocks
```

### Test Coverage
- **High coverage** on controllers and routes
- **58 tests** total (all passing)
  - 10 authentication controller tests
  - 22 task controller tests
  - 9 authentication route tests
  - 17 task route tests

### Test Cases Covered

**Authentication Controller (10 tests):**
- Successful registration/login
- Input validation (missing email/password)
- Invalid email format validation
- Password strength validation
- Supabase error handling
- Unexpected error handling

**Authentication Routes (9 tests):**
- Complete HTTP integration tests
- Request/response validation
- Error status code verification
- Route not found handling

**Task Controller (22 tests):**
- Create task with all validations
- Get all tasks with status filtering
- Get task by ID with ownership verification
- Update task with partial updates
- Delete task with ownership check
- Validation: missing title, invalid status
- Validation: circular parent reference prevention
- Database error handling
- User isolation verification

**Task Routes (17 tests):**
- POST /api/tasks: creation with validation
- GET /api/tasks: retrieval and filtering
- GET /api/tasks/:id: single task access
- PUT /api/tasks/:id: updates and validation
- DELETE /api/tasks/:id: deletion and errors
- Authentication requirement on all endpoints
- Malformed request handling
- Database error scenarios

## Development Workflow

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Development Best Practices
1. Write tests before implementing features (TDD)
2. Maintain high test coverage (>90%)
3. Use proper commit messages following conventional commits
4. Validate all inputs and handle errors gracefully
5. Log errors for debugging and monitoring

## Implementation Details

### User Isolation Pattern

All task operations follow a strict user isolation pattern:

1. **Authentication Layer**: `authMiddleware` validates JWT and extracts `user_id`
2. **Controller Layer**: All queries filtered by `req.user.id`
3. **Database Layer**: Supabase queries with `.eq('user_id', userId)`
4. **Response Layer**: 404 returned for non-existent or unauthorized resources

**Example Flow:**
```javascript
// 1. Middleware validates token
const { authenticateUser } = require('../middleware/authMiddleware');

// 2. Route applies middleware
router.get('/api/tasks', authenticateUser, taskController.getTasks);

// 3. Controller uses req.user.id
const getTasks = async (req, res) => {
  const userId = req.user.id;
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);  // Automatic isolation
};
```

### Error Handling Pattern

Consistent error responses across all endpoints:

```javascript
// Validation errors
return res.status(400).json({ 
  error: 'Validation error',
  message: 'Specific validation message' 
});

// Authentication errors
return res.status(401).json({ 
  error: 'Authentication required' 
});

// Not found errors
return res.status(404).json({ 
  error: 'Resource not found' 
});

// Server errors
return res.status(500).json({ 
  error: 'Internal server error',
  message: 'Details for debugging' 
});
```

## Future Enhancements

### Completed Features
- [x] Middleware for JWT authentication
- [x] Task management endpoints
- [x] User isolation and security
- [x] Comprehensive test coverage

### Planned Features
- [ ] API Rate Limiting
- [ ] Service Layer for complex business logic
- [ ] API documentation with OpenAPI/Swagger
- [ ] Request logging and monitoring
- [ ] Database migrations system
- [ ] File upload handling
- [ ] WebSocket support for real-time updates
- [ ] Caching layer for performance
- [ ] Pagination for large result sets

---

This guide will be updated as the backend evolves. For questions or contributions, please refer to the project's contribution guidelines.
