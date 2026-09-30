import test from 'node:test'
import assert from 'node:assert/strict'
import { toPublicProfileDTO } from '../lib/dto.ts'

test('toPublicProfileDTO - removes sensitive fields (telegram_chat_id, user_id, internal role)', () => {
  const internalProfile = {
    id: 'd0000000-0000-0000-0000-000000000001',
    user_id: 'secret-auth-uuid-9999',
    slug: 'deepak-kumar',
    role: 'master_admin',
    first_name: 'Deepak',
    last_name: 'Kumar',
    headline: 'UI/UX Engineer',
    work_email: 'deepak@designforge.studio',
    telegram_chat_id: '123456789',
    is_active: true,
  }

  const dto = toPublicProfileDTO(internalProfile)
  assert.ok(dto !== null)
  assert.equal(dto.slug, 'deepak-kumar')
  assert.equal(dto.firstName, 'Deepak')
  assert.equal(dto.lastName, 'Kumar')
  assert.equal(dto.workEmail, 'deepak@designforge.studio')

  // Sensitive fields must NOT exist on public DTO
  assert.equal(dto.user_id, undefined)
  assert.equal(dto.telegram_chat_id, undefined)
  assert.equal(dto.role, undefined)
})

test('toPublicProfileDTO - returns null for inactive profiles', () => {
  const inactiveProfile = {
    id: 'inactive-id',
    slug: 'inactive-slug',
    role: 'member',
    first_name: 'Jane',
    last_name: 'Doe',
    work_email: 'jane@example.com',
    is_active: false,
  }

  const dto = toPublicProfileDTO(inactiveProfile)
  assert.equal(dto, null)
})
