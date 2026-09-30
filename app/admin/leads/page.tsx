'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminExchangesPage from '../exchanges/page'

export default function LegacyAdminLeadsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/exchanges')
  }, [router])

  return <AdminExchangesPage />
}
