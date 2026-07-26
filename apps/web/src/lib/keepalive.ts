// Keeps the Render free-tier API awake. Render spins down after ~15 min idle
// (30-60s cold start), which makes the browser's fetch time out -> "Failed to fetch".
// Hitting /health on mount warms it up before the user interacts.
let warmGuard = false;

export function warmUpApi() {
  if (warmGuard) return;
  warmGuard = true;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  // fire-and-forget; ignore failures (it succeeds once the service is up)
  fetch(`${base}/health`, { method: 'GET', cache: 'no-store' })
    .then(() => {})
    .catch(() => {});
}
