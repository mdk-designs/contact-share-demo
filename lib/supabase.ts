import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Lazy Supabase client — only created when first used, and only if
 * environment variables are present. This prevents a crash on page
 * load when .env.local hasn't been set up yet (e.g. in development).
 */
function getClient(): SupabaseClient | null {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'Create a .env.local file from .env.example and restart the dev server.'
    )
    return null
  }

  _client = createClient(url, key)
  return _client
}

export interface Lead {
  name: string
  phone: string
  email?: string
  organization?: string
}

/**
 * Insert a visitor lead into Supabase.
 * Gracefully skips the insert if credentials are not configured
 * and logs a warning — the vCard download still fires.
 */
export async function insertLead(lead: Lead): Promise<{ error: Error | null }> {
  const client = getClient()

  if (!client) {
    // Graceful degradation: skip DB insert, let vCard flow continue
    return { error: null }
  }

  const { error } = await client.from('leads').insert([
    {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      organization: lead.organization || null,
    },
  ])

  return { error: error as Error | null }
}
