import PortalHeader from '@/components/PortalHeader'
import PortalGuard from '@/components/PortalGuard'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <PortalHeader />
      <PortalGuard>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </PortalGuard>
    </div>
  )
}
