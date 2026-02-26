const globalStore = globalThis.__rateLimitStore || new Map();

if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = globalStore;
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return (forwarded || realIp || 'anonymous').split(',')[0].trim();
}

export function enforceRateLimit(key, maxRequests = 300, windowMs = 60 * 1000) {
  const now = Date.now();
  const current = globalStore.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  globalStore.set(key, current);

  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    resetInMs: Math.max(0, current.resetAt - now),
  };
}