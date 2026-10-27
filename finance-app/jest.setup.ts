// jest.setup.ts — runs before each test suite
// Polyfill import.meta.env so financeService.ts can be imported in Jest
Object.defineProperty(globalThis, 'importMeta', { value: {} });

// Vite replaces import.meta.env at build time; in Jest we patch it here.
// ts-jest transforms files before Jest runs them, so we need to ensure
// the global is set before any module is evaluated.
if (typeof (globalThis as Record<string, unknown>).__viteMockEnv === 'undefined') {
  (globalThis as Record<string, unknown>).__viteMockEnv = true;
}
