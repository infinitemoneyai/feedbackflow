/**
 * Vitest setup file
 * This file runs before all tests
 */

import { vi, beforeEach, afterEach } from "vitest";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");

// Clear all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

// Mock console.error to reduce noise in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out expected test errors
  const message = args[0]?.toString() || "";
  if (
    message.includes("Expected error") ||
    message.includes("Test error") ||
    message.includes("API key validation error")
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Global type augmentation for test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    createMockRequest: (options?: RequestInit & { url?: string }) => Request;
    createMockHeaders: (headers?: Record<string, string>) => Headers;
  };
}

// Test utility functions
globalThis.testUtils = {
  createMockRequest: (options = {}) => {
    const { url = "http://localhost:3000", ...init } = options;
    return new Request(url, init);
  },
  createMockHeaders: (headers = {}) => {
    return new Headers(headers);
  },
};
