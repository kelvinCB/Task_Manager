module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allowed types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New functionality
        'fix',      // Bug fixes
        'docs',     // Documentation
        'style',    // Format changes
        'refactor', // Refactoring
        'test',     // Tests
        'chore',    // Maintenance
        'perf',     // Performance improvements
        'ci',       // CI/CD
        'build',    // Build system
        'revert'    // Revert commits
      ]
    ],
    
    // Allowed scopes (optional but recommended)
    'scope-enum': [
      1, // warning, not error
      'always',
      [
        'auth',     // Authentication
        'tasks',    // Task management
        'ui',       // User interface
        'api',      // API logic
        'db',       // Database
        'config',   // Configuration
        'tests',    // Testing system
        'docs',     // Documentation
        'timer',    // Timer system
        'hooks',    // React hooks
        'utils',    // Utilities
        'components' // React components
      ]
    ],
    
    // Type must be in lowercase
    'type-case': [2, 'always', 'lower-case'],
    
    // Scope must be in lowercase
    'scope-case': [2, 'always', 'lower-case'],
    
    // Description must start in lowercase
    'subject-case': [2, 'always', 'lower-case'],
    
    // Description must not end with period
    'subject-full-stop': [2, 'never', '.'],
    
    // Description must not be empty
    'subject-empty': [2, 'never'],
    
    // Description must have at least 10 characters
    'subject-min-length': [2, 'always', 10],
    
    // Description must not exceed 72 characters
    'subject-max-length': [2, 'always', 72],
    
    // Header must not exceed 100 characters
    'header-max-length': [2, 'always', 100],
    
    // Body lines must not exceed 100 characters
    'body-max-line-length': [1, 'always', 100],
    
    // Footer must not exceed 100 characters per line
    'footer-max-line-length': [1, 'always', 100]
  }
};
