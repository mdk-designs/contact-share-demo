import { NextRequest } from 'next/server'
import { handleExchange } from '@/app/api/exchanges/route'

export async function POST(request: NextRequest) {
  return handleExchange(request)
}
