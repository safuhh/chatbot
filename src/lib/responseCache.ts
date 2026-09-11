/**
 * responseCache.ts — In-memory LRU-style cache for Gemini responses.
 *
 * Safety rules:
 *  • Cache keys include a normalized prompt + context hash, NOT user identity.
 *  • Only context-free factual responses are cached (no user-specific data).
 *  • TTL: 1 hour. Entries expire automatically.
 *  • Temporary chat responses are NEVER cached (caller is responsible).
 *  • Max 100 entries; oldest are evicted when limit is reached.
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 100;

interface CacheEntry {
  response: string;
  expiresAt: number;
  insertedAt: number;
}

// Simple in-memory store — lives only for this browser session (no localStorage)
const store = new Map<string, CacheEntry>();

/**
 * Build a stable cache key from the prompt and conversation context.
 * We only cache when there is NO prior conversation context (first message or standalone factual question),
 * because context-dependent answers must not be reused across different conversations.
 */
export function buildCacheKey(
  prompt: string,
  historyLength: number
): string | null {
  // Only cache zero-context requests (no prior turns) to avoid cross-conversation data leakage
  if (historyLength > 0) return null;

  const normalized = prompt.trim().toLowerCase().replace(/\s+/g, " ");

  // Don't cache very short or personal-sounding prompts
  if (normalized.length < 8) return null;
  if (/\b(my|i am|i'm|our|we|me|mine)\b/.test(normalized)) return null;

  return `v1:${normalized}`;
}

/** Return cached response if it exists and hasn't expired. */
export function getCached(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.response;
}

/** Store a response in the cache, evicting oldest entry if over limit. */
export function setCached(key: string, response: string): void {
  if (store.size >= CACHE_MAX_SIZE) {
    // Evict the oldest inserted entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of store) {
      if (v.insertedAt < oldestTime) {
        oldestTime = v.insertedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(key, {
    response,
    expiresAt: Date.now() + CACHE_TTL_MS,
    insertedAt: Date.now(),
  });
}

/** Invalidate a specific cache key (e.g. after a model change). */
export function invalidateCached(key: string): void {
  store.delete(key);
}

/** Return cache stats for debugging. */
export function getCacheStats(): { size: number; maxSize: number; ttlHours: number } {
  return { size: store.size, maxSize: CACHE_MAX_SIZE, ttlHours: CACHE_TTL_MS / 3_600_000 };
}
