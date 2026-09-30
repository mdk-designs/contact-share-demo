import { NextRequest, NextResponse } from 'next/server'
import { recordWhatsAppClick } from '@/lib/supabase'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Missing exchange id' }, { status: 400 })
    }

    const recorded = await recordWhatsAppClick(id)
    return NextResponse.json({ success: recorded })
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
