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
SUPABASE_KEY=your_supabase_anon_key
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
│   │   └── authController.js     # Authentication logic
│   ├── routes/
│   │   └── auth.js               # Authentication routes
│   ├── middlewares/              # Custom middleware (future)
│   ├── services/                 # Business logic layer (future)
│   ├── tests/
│   │   ├── controllers/          # Unit tests for controllers
│   │   ├── routes/               # Integration tests for routes
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
- **authController.js** - Handles authentication logic with input validation, email normalization, and comprehensive error handling

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
- Secure handling of all user inputs
- Password strength validation (minimum 6 characters)
- Email format validation with regex
- Environment variable validation
- Proper HTTP status codes (400, 401, 500)

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
│   └── authController.test.js    # Unit tests for auth controller
├── routes/
│   └── auth.test.js              # Integration tests for auth routes
└── setup.js                     # Test configuration and mocks
```

### Test Coverage
- **90.62%** coverage on controllers
- **100%** coverage on routes
- **19 tests** total (all passing)

### Test Cases Covered
**Authentication Controller:**
- Successful registration/login
- Input validation (missing email/password)
- Invalid email format validation
- Password strength validation
- Supabase error handling
- Unexpected error handling

**Authentication Routes:**
- Complete HTTP integration tests
- Request/response validation
- Error status code verification
- Route not found handling

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

## Future Enhancements

### Planned Features
- [ ] API Rate Limiting
- [ ] Service Layer Documentation
- [ ] Middleware for authentication
- [ ] Database schema validation
- [ ] API documentation with OpenAPI/Swagger
- [ ] Request logging and monitoring
- [ ] Database migrations system
- [ ] Task management endpoints
- [ ] File upload handling
- [ ] WebSocket support for real-time updates

---

This guide will be updated as the backend evolves. For questions or contributions, please refer to the project's contribution guidelines.
