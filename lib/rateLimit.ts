import crypto from 'crypto'

interface RateLimitRecord {
  count: number
  resetAt: number
}

// In-memory cache for sliding window rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically clean up expired records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}

/**
 * Creates a privacy-safe SHA-256 hash of an IP address so raw IP is never logged or exposed.
 */
export function hashIp(ip: string): string {
  if (!ip) return 'anonymous'
  return crypto.createHash('sha256').update(ip.trim()).digest('hex').slice(0, 16)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * Checks sliding window rate limit.
 * @param identifier Hashed IP or composite key
 * @param limit Max allowed requests within window (default: 10)
 * @param windowSeconds Window length in seconds (default: 60)
 */
export function checkRateLimit(
  identifier: string,
  limit = 10,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = rateLimitMap.get(identifier)

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    }
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.ceil((record.resetAt - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  }
}
