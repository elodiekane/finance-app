// Single source of truth for the mock/live data-source decision.
// Read the env flag safely in both Vite (import.meta.env) and Jest (globals injection).
// ts-jest injects import.meta via the globals config but evaluates it at transform time;
// wrapping in a function avoids the top-level ESM-vs-CJS timing issue in Jest 30.
export function isMockMode(): boolean {
  try {
    // In Vite this is statically replaced at build time.
    // In Jest, ts-jest injects the value via globals['import.meta'].
    return import.meta.env.VITE_USE_MOCK !== 'false';
  } catch {
    // Fallback for environments where import.meta is unavailable (Jest without globals).
    return true;
  }
}
