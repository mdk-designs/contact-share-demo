import { NextRequest, NextResponse } from 'next/server'
import { resolveProfileWithFallback, logQrScan } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const profile = await resolveProfileWithFallback(slug)

    if (profile?.id) {
      const userAgent = request.headers.get('user-agent') || undefined
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        undefined

      await logQrScan(profile.id, userAgent, ip)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.warn('[API /api/scan/[slug]] Scan tracking error:', err)
    return NextResponse.json({ success: false }, { status: 200 }) // Non-blocking
  }
}
