// jest.workerSetup.ts
// Runs inside each Jest worker before any test module is imported.
// Sets process.env values that module-level code reads on first import.
process.env.MOCK_LATENCY = '0';
