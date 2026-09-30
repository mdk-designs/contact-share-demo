import test from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = 'http://localhost:3000'

test('API Security - /api/profiles does not leak user_id or telegram_chat_id', async () => {
  const res = await fetch(`${BASE_URL}/api/profiles?slug=deepak-kumar`)
  assert.equal(res.status, 200)
  const profile = await res.json()

  assert.ok(profile.firstName)
  assert.ok(profile.slug)
  assert.equal(profile.user_id, undefined)
  assert.equal(profile.telegram_chat_id, undefined)
  assert.equal(profile.role, undefined)
})

test('API Endpoint - /api/vcard/deepak-kumar returns valid vCard stream', async () => {
  const res = await fetch(`${BASE_URL}/api/vcard/deepak-kumar`)
  assert.equal(res.status, 200)
  assert.ok(res.headers.get('content-type')?.includes('text/vcard'))

  const text = await res.text()
  assert.ok(text.includes('BEGIN:VCARD'))
  assert.ok(text.includes('FN:Deepak Kumar'))
  assert.ok(text.includes('END:VCARD'))
})

test('API Validation - /api/lead/exchange rejects missing required name or phone', async () => {
  const res = await fetch(`${BASE_URL}/api/lead/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitor_name: '',
      visitor_phone: '',
    }),
  })

  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error?.code, 'VALIDATION_ERROR')
})

test('API Idempotency - duplicate submission with same idempotency_key does not duplicate', async () => {
  const key = `test-idempotency-${Date.now()}`
  const payload = {
    slug: 'deepak-kumar',
    visitor_name: 'Idempotency Tester',
    visitor_phone: '+91 99999 88888',
    visitor_email: 'tester@example.com',
    source: 'qr',
    idempotency_key: key,
  }

  // First submission
  const res1 = await fetch(`${BASE_URL}/api/lead/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  assert.equal(res1.status, 200)
  const data1 = await res1.json()
  assert.equal(data1.success, true)
  assert.ok(data1.exchange_id)

  // Second submission with exact same idempotency_key
  const res2 = await fetch(`${BASE_URL}/api/lead/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  assert.equal(res2.status, 200)
  const data2 = await res2.json()
  assert.equal(data2.success, true)
  assert.equal(data2.is_duplicate, true)
  assert.equal(data2.exchange_id, data1.exchange_id)
})
