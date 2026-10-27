// jest.globalSetup.ts — runs in Node before any test suite is imported
// Sets env vars that module-level code in the test subjects reads on first import.
export default async function globalSetup() {
  process.env.MOCK_LATENCY = '0';
}
