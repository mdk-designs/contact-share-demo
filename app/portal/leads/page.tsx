'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MemberExchangesPage from '../exchanges/page'

export default function LegacyPortalLeadsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/portal/exchanges')
  }, [router])

  return <MemberExchangesPage />
}
