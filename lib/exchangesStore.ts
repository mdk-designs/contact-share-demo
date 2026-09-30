import fs from 'fs'
import path from 'path'
import type { ContactExchange } from './supabase'

const EXCHANGES_FILE = path.join(process.cwd(), 'data', 'contact_exchanges.json')

function ensureDir() {
  const dir = path.dirname(EXCHANGES_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getLocalExchanges(profileId?: string): ContactExchange[] {
  try {
    ensureDir()
    if (!fs.existsSync(EXCHANGES_FILE)) {
      // Migrate from leads.json if contact_exchanges.json does not exist yet
      const legacyFile = path.join(process.cwd(), 'data', 'leads.json')
      if (fs.existsSync(legacyFile)) {
        try {
          const raw = fs.readFileSync(legacyFile, 'utf-8')
          const legacyLeads = JSON.parse(raw)
          if (Array.isArray(legacyLeads)) {
            const migrated: ContactExchange[] = legacyLeads.map((l: any) => ({
              id: l.id || crypto.randomUUID(),
              profile_id: l.profile_id || 'demo-profile-deepak',
              visitor_name: l.visitor_name || l.name || 'Anonymous',
              visitor_phone: l.visitor_phone || l.phone || '',
              visitor_email: l.visitor_email || l.email,
              visitor_company: l.visitor_company || l.organization,
              visitor_job_title: l.visitor_job_title,
              notes: l.notes,
              source: 'direct',
              cardholder_vcard_status: 'sent',
              visitor_vcard_status: 'sent',
              email_status: l.vcard_emailed ? 'sent' : 'not_applicable',
              cardholder_telegram_status: 'not_applicable',
              visitor_telegram_status: 'not_applicable',
              created_at: l.created_at || new Date().toISOString(),
              updated_at: l.created_at || new Date().toISOString(),
            }))
            fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(migrated, null, 2), 'utf-8')
            return profileId ? migrated.filter((e) => e.profile_id === profileId) : migrated
          }
        } catch {
          // Ignore
        }
      }
      return []
    }
    const raw = fs.readFileSync(EXCHANGES_FILE, 'utf-8')
    const list: ContactExchange[] = JSON.parse(raw)
    if (profileId) {
      return list.filter((e) => e.profile_id === profileId)
    }
    return list
  } catch (err) {
    console.warn('[exchangesStore] Error reading local exchanges:', err)
    return []
  }
}

export function saveLocalExchange(exchange: ContactExchange): ContactExchange {
  try {
    ensureDir()
    const list = getLocalExchanges()
    // Check for existing exchange with same idempotency_key
    if (exchange.idempotency_key) {
      const existing = list.find((e) => e.idempotency_key === exchange.idempotency_key)
      if (existing) return existing
    }

    const idx = list.findIndex((e) => e.id === exchange.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...exchange, updated_at: new Date().toISOString() }
    } else {
      list.unshift(exchange)
    }
    fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(list, null, 2), 'utf-8')
    return exchange
  } catch (err) {
    console.warn('[exchangesStore] Error saving local exchange:', err)
    return exchange
  }
}

export function updateLocalExchange(id: string, updates: Partial<ContactExchange>): ContactExchange | null {
  try {
    ensureDir()
    const list = getLocalExchanges()
    const idx = list.findIndex((e) => e.id === id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(list, null, 2), 'utf-8')
      return list[idx]
    }
    return null
  } catch (err) {
    console.warn('[exchangesStore] Error updating local exchange:', err)
    return null
  }
}

export function deleteLocalExchange(id: string): boolean {
  try {
    ensureDir()
    const list = getLocalExchanges()
    const filtered = list.filter((e) => e.id !== id)
    fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.warn('[exchangesStore] Error deleting local exchange:', err)
    return false
  }
}
