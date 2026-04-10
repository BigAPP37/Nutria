import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type AiLogMethod = 'photo' | 'text'

export type AiRateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

const TEXT_LIMIT_PER_MINUTE = 30
const PHOTO_LIMIT_PER_MINUTE = 10
const WINDOW = '1 m'

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const hasUpstashConfig = Boolean(upstashUrl && upstashToken)

const redis = hasUpstashConfig
  ? new Redis({
      url: upstashUrl!,
      token: upstashToken!,
    })
  : null

const textRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(TEXT_LIMIT_PER_MINUTE, WINDOW),
      prefix: 'ratelimit:ai-log:text',
    })
  : null

const photoRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(PHOTO_LIMIT_PER_MINUTE, WINDOW),
      prefix: 'ratelimit:ai-log:photo',
    })
  : null

type InMemoryBucket = {
  count: number
  reset: number
}

const rateLimitState = globalThis as typeof globalThis & {
  __nutriaAiRateLimitBuckets__?: Map<string, InMemoryBucket>
  __nutriaAiRateLimitWarned__?: boolean
}

function getLimitForMethod(method: AiLogMethod) {
  return method === 'photo' ? PHOTO_LIMIT_PER_MINUTE : TEXT_LIMIT_PER_MINUTE
}

function getFallbackStore() {
  if (!rateLimitState.__nutriaAiRateLimitBuckets__) {
    rateLimitState.__nutriaAiRateLimitBuckets__ = new Map()
  }

  if (!hasUpstashConfig && !rateLimitState.__nutriaAiRateLimitWarned__) {
    console.warn(
      '[ai-rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes. Usando fallback local en memoria.'
    )
    rateLimitState.__nutriaAiRateLimitWarned__ = true
  }

  return rateLimitState.__nutriaAiRateLimitBuckets__
}

function fallbackLimit(identifier: string, method: AiLogMethod): AiRateLimitResult {
  const store = getFallbackStore()
  const now = Date.now()
  const limit = getLimitForMethod(method)
  const reset = now + 60_000
  const key = `${method}:${identifier}`
  const bucket = store.get(key)

  if (!bucket || bucket.reset <= now) {
    store.set(key, { count: 1, reset })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    }
  }

  bucket.count += 1
  store.set(key, bucket)

  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.reset,
  }
}

export async function limitAiLogRequests(
  identifier: string,
  method: AiLogMethod
): Promise<AiRateLimitResult> {
  if (!redis) {
    return fallbackLimit(identifier, method)
  }

  const limiter = method === 'photo' ? photoRateLimit : textRateLimit
  const result = await limiter!.limit(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
