import test from 'node:test'
import assert from 'node:assert/strict'
import { checkRateLimit, hashIp } from '../lib/rateLimit.ts'

test('hashIp - produces deterministic privacy-safe hash', () => {
  const hash1 = hashIp('192.168.1.1')
  const hash2 = hashIp('192.168.1.1')
  const hash3 = hashIp('10.0.0.1')

  assert.equal(hash1, hash2)
  assert.notEqual(hash1, hash3)
  assert.equal(hash1.length, 16)
})

test('checkRateLimit - enforces sliding window rate limit', () => {
  const id = `test-ip-${Date.now()}`
  const limit = 3

  const r1 = checkRateLimit(id, limit, 10)
  assert.equal(r1.allowed, true)
  assert.equal(r1.remaining, 2)

  const r2 = checkRateLimit(id, limit, 10)
  assert.equal(r2.allowed, true)
  assert.equal(r2.remaining, 1)

  const r3 = checkRateLimit(id, limit, 10)
  assert.equal(r3.allowed, true)
  assert.equal(r3.remaining, 0)

  // 4th request must be rejected
  const r4 = checkRateLimit(id, limit, 10)
  assert.equal(r4.allowed, false)
  assert.equal(r4.remaining, 0)
  assert.ok(r4.resetInSeconds > 0)
})
