import fs from 'fs'
import path from 'path'
import type { Profile } from './supabase'

const DATA_FILE = path.join(process.cwd(), 'data', 'profiles.json')

export function getLocalProfiles(): Profile[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as Profile[]
  } catch (err) {
    console.warn('[profilesStore] Failed to read profiles:', err)
    return []
  }
}

export function getLocalProfileBySlug(slug: string): Profile | null {
  const clean = slug.toLowerCase().trim()
  const profiles = getLocalProfiles()
  return profiles.find((p) => p.slug.toLowerCase().trim() === clean) || null
}

export function saveLocalProfile(profile: Profile): Profile {
  const profiles = getLocalProfiles()
  const cleanSlug = profile.slug.toLowerCase().trim()
  const existingIdx = profiles.findIndex(
    (p) => p.id === profile.id || p.slug.toLowerCase().trim() === cleanSlug
  )

  const updatedProfile: Profile = {
    ...profile,
    slug: cleanSlug,
    is_active: profile.is_active ?? true,
    updated_at: new Date().toISOString(),
  }

  if (existingIdx >= 0) {
    profiles[existingIdx] = { ...profiles[existingIdx], ...updatedProfile }
  } else {
    profiles.unshift({
      ...updatedProfile,
      created_at: updatedProfile.created_at || new Date().toISOString(),
    })
  }

  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8')
  } catch (err) {
    console.error('[profilesStore] Failed to save profile:', err)
  }

  return updatedProfile
}

export function updateLocalProfile(
  idOrSlug: string,
  updates: Partial<Profile>
): Profile | null {
  const profiles = getLocalProfiles()
  const key = idOrSlug.toLowerCase().trim()
  const idx = profiles.findIndex(
    (p) => p.id === idOrSlug || p.slug.toLowerCase().trim() === key
  )

  if (idx < 0) return null

  profiles[idx] = {
    ...profiles[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8')
  } catch (err) {
    console.error('[profilesStore] Failed to update profile:', err)
  }

  return profiles[idx]
}

export function deleteLocalProfile(idOrSlug: string): boolean {
  const profiles = getLocalProfiles()
  const key = idOrSlug.toLowerCase().trim()
  const next = profiles.filter(
    (p) => p.id !== idOrSlug && p.slug.toLowerCase().trim() !== key
  )

  if (next.length === profiles.length) return false

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('[profilesStore] Failed to delete profile:', err)
    return false
  }
}
