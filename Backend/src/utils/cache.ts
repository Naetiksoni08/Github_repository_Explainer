import crypto from "crypto";

interface CacheEntry {
    repoUrl: string;
    answer: string;
    createdAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizeQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?.!]+$/g, "");
}

function getCacheKey(repoUrl: string, query: string): string {
    const normalized = normalizeQuery(query);
    return crypto.createHash("md5").update(`${repoUrl}::${normalized}`).digest("hex");
}

function getCachedResponse(repoUrl: string, query: string): string | null {
    const key = getCacheKey(repoUrl, query);
    const entry = responseCache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
        responseCache.delete(key);
        return null;
    }

    return entry.answer;
}

function setCachedResponse(repoUrl: string, query: string, answer: string): void {
    if (!answer || answer.trim().length < 10) return;

    const key = getCacheKey(repoUrl, query);
    responseCache.set(key, { repoUrl, answer, createdAt: Date.now() });
}

// call this whenever a repo is re-ingested, so stale cached answers don't linger
function invalidateCacheForRepo(repoUrl: string): void {
    for (const [key, entry] of responseCache) {
        if (entry.repoUrl === repoUrl) {
            responseCache.delete(key);
        }
    }
}

export { getCachedResponse, setCachedResponse, invalidateCacheForRepo, normalizeQuery };