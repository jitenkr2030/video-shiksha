import { Loader2, LucideIcon } from 'lucide-react'

interface IconsProps {
  icon: 'spinner'
  className?: string
}

export function Icons({ icon, className }: IconsProps): JSX.Element {
  const icons: Record<string, LucideIcon> = {
    spinner: Loader2,
  }

  const Icon = icons[icon]

  if (!Icon) {
    console.warn(`Icon "${icon}" not found`)
    return <></>
  }

  return <Icon className={className} />
}