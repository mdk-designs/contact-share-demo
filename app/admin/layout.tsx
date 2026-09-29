import AdminHeader from '@/components/AdminHeader'
import AdminGuard from '@/components/AdminGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <AdminHeader />
      <AdminGuard>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </AdminGuard>
    </div>
  )
}
