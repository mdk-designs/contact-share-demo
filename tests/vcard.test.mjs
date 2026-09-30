import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeVCardText, generateVCardString, generateVisitorVCardString } from '../lib/vcard.ts'

test('escapeVCardText - correctly escapes semicolons, commas, backslashes, and newlines', () => {
  const input = 'O\\Connor; Jr., CEO\nDesign Studio'
  const escaped = escapeVCardText(input)
  assert.equal(escaped, 'O\\\\Connor\\; Jr.\\, CEO\\nDesign Studio')
})

test('generateVCardString - produces compliant RFC 3.0 vCard with Unicode and escaping', () => {
  const card = generateVCardString({
    firstName: 'René',
    lastName: 'Müller; Dr.',
    organization: 'Acme, Inc.; Labs',
    jobTitle: 'Principal Designer',
    workEmail: 'rene@acme.com',
    mobilePhone: '+49123456789',
    url: 'https://acme.com',
    bio: 'Crafting fine designs & architecture.\nAvailable worldwide.',
  })

  assert.ok(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0'))
  assert.ok(card.includes('N:Müller\\; Dr.;René;;;'))
  assert.ok(card.includes('FN:René Müller\\; Dr.'))
  assert.ok(card.includes('ORG:Acme\\, Inc.\\; Labs'))
  assert.ok(card.includes('EMAIL;TYPE=INTERNET,WORK:rene@acme.com'))
  assert.ok(card.includes('TEL;TYPE=CELL,VOICE:+49123456789'))
  assert.ok(card.includes('NOTE:Crafting fine designs & architecture.\\nAvailable worldwide.'))
  assert.ok(card.endsWith('END:VCARD'))
})

test('generateVisitorVCardString - produces valid visitor vCard', () => {
  const vcard = generateVisitorVCardString({
    name: 'Sarah Connor',
    phone: '+15552345678',
    email: 'sarah@resistance.org',
    organization: 'Cyberdyne Systems',
    jobTitle: 'Security Lead',
  })

  assert.ok(vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0'))
  assert.ok(vcard.includes('N:Connor;Sarah;;;'))
  assert.ok(vcard.includes('FN:Sarah Connor'))
  assert.ok(vcard.includes('ORG:Cyberdyne Systems'))
  assert.ok(vcard.includes('TEL;TYPE=CELL,VOICE:+15552345678'))
  assert.ok(vcard.endsWith('END:VCARD'))
})
