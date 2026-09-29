import fs from 'fs'
import path from 'path'
import type { Lead } from './supabase'

const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json')

export function getLocalLeads(profileId?: string): Lead[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const leads = JSON.parse(raw) as Lead[]
    if (profileId) {
      return leads.filter((l) => l.profile_id === profileId)
    }
    return leads
  } catch (err) {
    console.warn('[leadsStore] Failed to read leads:', err)
    return []
  }
}

export function saveLocalLead(lead: Lead): Lead {
  const leads = getLocalLeads()
  const newLead: Lead = {
    ...lead,
    id: lead.id || crypto.randomUUID(),
    created_at: lead.created_at || new Date().toISOString(),
  }

  // Prepend newest lead
  leads.unshift(newLead)

  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8')
  } catch (err) {
    console.error('[leadsStore] Failed to save lead:', err)
  }

  return newLead
}

export function updateLocalLead(id: string, updates: Partial<Lead>): Lead | null {
  const leads = getLocalLeads()
  const idx = leads.findIndex((l) => l.id === id)
  if (idx < 0) return null

  leads[idx] = {
    ...leads[idx],
    ...updates,
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8')
  } catch (err) {
    console.error('[leadsStore] Failed to update lead:', err)
  }

  return leads[idx]
}

export function deleteLocalLead(id: string): boolean {
  const leads = getLocalLeads()
  const next = leads.filter((l) => l.id !== id)
  if (next.length === leads.length) return false

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('[leadsStore] Failed to delete lead:', err)
    return false
  }
}
