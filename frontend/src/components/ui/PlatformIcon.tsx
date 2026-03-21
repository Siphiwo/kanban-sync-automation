import { CheckSquare, Trello, Grid2X2, Layers, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons: Record<string, React.ElementType> = {
  asana: CheckSquare,
  trello: Trello,
  monday: Grid2X2,
  jira: Layers,
  linear: Zap,
}

const colors: Record<string, string> = {
  asana: 'text-[#f06a6a]',
  trello: 'text-[#0052cc]',
  monday: 'text-[#ff3d57]',
  jira: 'text-[#0052cc]',
  linear: 'text-[#5e6ad2]',
}

interface PlatformIconProps {
  platform: string
  className?: string
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const Icon = icons[platform.toLowerCase()] ?? Grid2X2
  return <Icon className={cn('w-5 h-5', colors[platform.toLowerCase()], className)} />
}
