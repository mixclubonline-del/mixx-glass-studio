/**
 * Prime Brain LLM Cache
 * 
 * Implements intelligent caching for LLM responses to reduce API calls and costs.
 * Uses localStorage for persistence across sessions.
 * 
 * Features:
 * - Response caching with TTL (time-to-live)
 * - Semantic cache key generation (same meaning = same cache)
 * - Cost tracking and statistics
 * - Automatic cache pruning
 */

interface CachedResponse {
  content: string;
  timestamp: number;
  model: string;
  tokens?: number;
  cost?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalCached: number;
  totalSaved: number; // Estimated cost savings
}

const CACHE_PREFIX = 'primebrain:cache:';
const CACHE_STATS_KEY = 'primebrain:cache:stats';
const MAX_CACHE_SIZE = 1000; // Maximum number of cached responses
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours default TTL

/**
 * Generate a cache key from prompt and context
 * Uses a simple hash of the prompt + context for semantic caching
 */
function generateCacheKey(
  prompt: string,
  context?: Record<string, any>,
  options?: Record<string, any>
): string {
  const keyData = {
    prompt: prompt.trim().toLowerCase(),
    context: context ? JSON.stringify(context) : '',
    model: options?.model || 'gemini-2.5-flash',
    temperature: options?.temperature || 0.7,
  };
  
  // Simple hash function
  const str = JSON.stringify(keyData);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse(
  prompt: string,
  context?: Record<string, any>,
  options?: Record<string, any>,
  ttlMs: number = DEFAULT_TTL_MS
): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const cacheKey = generateCacheKey(prompt, context, options);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      updateStats({ miss: true });
      return null;
    }

    const response: CachedResponse = JSON.parse(cached);
    const age = Date.now() - response.timestamp;

    if (age > ttlMs) {
      // Expired, remove it
      localStorage.removeItem(cacheKey);
      updateStats({ miss: true });
      return null;
    }

    // Cache hit!
    updateStats({ hit: true, saved: response.cost || 0 });
    return response.content;
  } catch (error) {
    console.warn('Prime Brain cache read error:', error);
    updateStats({ miss: true });
    return null;
  }
}

/**
 * Store response in cache
 */
export function setCachedResponse(
  prompt: string,
  content: string,
  context?: Record<string, any>,
  options?: Record<string, any>,
  metadata?: { tokens?: number; cost?: number }
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const cacheKey = generateCacheKey(prompt, context, options);
    const cached: CachedResponse = {
      content,
      timestamp: Date.now(),
      model: options?.model || 'gemini-2.5-flash',
      tokens: metadata?.tokens,
      cost: metadata?.cost,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cached));
    
    // Prune cache if it's getting too large
    pruneCacheIfNeeded();
  } catch (error) {
    // Handle quota exceeded errors gracefully
    if (error instanceof DOMException && error.code === 22) {
      console.warn('Prime Brain cache storage quota exceeded, pruning...');
      pruneCache();
    } else {
      console.warn('Prime Brain cache write error:', error);
    }
  }
}

/**
 * Update cache statistics
 */
function updateStats(update: { hit?: boolean; miss?: boolean; saved?: number }): void {
  try {
    const statsJson = localStorage.getItem(CACHE_STATS_KEY);
    const stats: CacheStats = statsJson 
      ? JSON.parse(statsJson)
      : { hits: 0, misses: 0, totalCached: 0, totalSaved: 0 };

    if (update.hit) stats.hits++;
    if (update.miss) stats.misses++;
    if (update.saved) stats.totalSaved += update.saved;

    localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    // Silently fail stats updates
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  try {
    const statsJson = localStorage.getItem(CACHE_STATS_KEY);
    if (statsJson) {
      return JSON.parse(statsJson);
    }
  } catch (error) {
    // Ignore errors
  }
  
  return { hits: 0, misses: 0, totalCached: 0, totalSaved: 0 };
}

/**
 * Count cached items
 */
function countCachedItems(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      count++;
    }
  }
  return count;
}

/**
 * Prune cache if it exceeds maximum size
 */
function pruneCacheIfNeeded(): void {
  const count = countCachedItems();
  if (count > MAX_CACHE_SIZE) {
    pruneCache();
  }
}

/**
 * Prune cache by removing oldest entries
 */
function pruneCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Collect all cache entries with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const response: CachedResponse = JSON.parse(cached);
            entries.push({ key, timestamp: response.timestamp });
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  } catch (error) {
    console.warn('Prime Brain cache prune error:', error);
  }
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem(CACHE_STATS_KEY);
}

/**
 * Estimate cost savings from cache
 * Based on Gemini API pricing (approximate)
 */
export function estimateCostSavings(): number {
  const stats = getCacheStats();
  // Rough estimate: $0.0001 per 1K tokens (Gemini Flash pricing)
  // Assuming average 500 tokens per response
  const avgCostPerResponse = 0.00005;
  return stats.hits * avgCostPerResponse;
}
