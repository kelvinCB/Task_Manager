// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';