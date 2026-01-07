import { Metadata } from 'next'
import { DashboardNav } from '@/components/dashboard-nav'
import { Sidebar } from '@/components/sidebar'

export const metadata: Metadata = {
  title: 'Dashboard - VideoShiksha',
  description: 'Your VideoShiksha dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}