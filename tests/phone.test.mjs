import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhoneNumber, buildWhatsAppUrl } from '../lib/phone.ts'

test('normalizePhoneNumber - formats Indian mobile numbers correctly', () => {
  const res1 = normalizePhoneNumber('+91 98765 43210')
  assert.equal(res1.valid, true)
  assert.equal(res1.e164, '+919876543210')
  assert.equal(res1.digitsOnly, '919876543210')

  const res2 = normalizePhoneNumber('9876543210', '+91')
  assert.equal(res2.valid, true)
  assert.equal(res2.e164, '+919876543210')
  assert.equal(res2.digitsOnly, '919876543210')
})

test('normalizePhoneNumber - formats US/Canada numbers', () => {
  const res = normalizePhoneNumber('(555) 234-5678', '+1')
  assert.equal(res.valid, true)
  assert.equal(res.e164, '+15552345678')
  assert.equal(res.digitsOnly, '15552345678')
})

test('normalizePhoneNumber - rejects malformed or too short numbers', () => {
  const res1 = normalizePhoneNumber('123')
  assert.equal(res1.valid, false)

  const res2 = normalizePhoneNumber('')
  assert.equal(res2.valid, false)

  const res3 = normalizePhoneNumber('abc-def-ghij')
  assert.equal(res3.valid, false)
})

test('buildWhatsAppUrl - creates valid WhatsApp deep links with encoded messages', () => {
  const url1 = buildWhatsAppUrl('+91 98765 43210')
  assert.equal(url1, 'https://wa.me/919876543210')

  const url2 = buildWhatsAppUrl('+91 98765 43210', 'Hi Deepak! It was great connecting.')
  assert.equal(url2, 'https://wa.me/919876543210?text=Hi%20Deepak!%20It%20was%20great%20connecting.')

  const urlInvalid = buildWhatsAppUrl('invalid')
  assert.equal(urlInvalid, null)
})
