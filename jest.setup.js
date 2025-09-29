// Jest setup file
const { TextEncoder, TextDecoder } = require("node:util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.subtle for Node environment
Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      digest: jest.fn(),
    },
  },
});

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
