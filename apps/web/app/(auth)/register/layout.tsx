import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register - VideoShiksha',
  description: 'Create your VideoShiksha account',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}