import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',

  // globalSetup runs in the main Node process — not in workers.
  // setupFiles runs inside each worker BEFORE any module is imported,
  // so MOCK_LATENCY=0 is visible to the IIFE in mockData.ts.
  setupFiles: ['./jest.workerSetup.ts'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        verbatimModuleSyntax: false,
        module: 'CommonJS',
        moduleResolution: 'node',
      },
      diagnostics: false,
    }],
  },
  moduleNameMapper: {
    '^recharts$': '<rootDir>/src/__tests__/__mocks__/rechartsMock.ts',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/__mocks__/styleMock.ts',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
  },
  globals: {
    // Inject import.meta.env so Vite-style env vars work in ts-jest
    'import.meta': {
      env: {
        VITE_USE_MOCK: 'true',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false,
      },
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
};

export default config;
