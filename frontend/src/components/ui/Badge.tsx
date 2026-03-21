import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'brand' | 'platform'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  platform?: string
}

const platformColors: Record<string, string> = {
  asana: 'bg-[#f06a6a]/10 text-[#f06a6a] border-[#f06a6a]/20',
  trello: 'bg-[#0052cc]/10 text-[#0052cc] border-[#0052cc]/20',
  monday: 'bg-[#ff3d57]/10 text-[#ff3d57] border-[#ff3d57]/20',
  jira: 'bg-[#0052cc]/10 text-[#0052cc] border-[#0052cc]/20',
  linear: 'bg-[#5e6ad2]/10 text-[#5e6ad2] border-[#5e6ad2]/20',
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  brand: 'bg-brand-50 text-brand-600 border-brand-100',
  platform: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

export function Badge({ variant = 'neutral', platform, className, children, ...props }: BadgeProps) {
  const colorClass =
    variant === 'platform' && platform
      ? platformColors[platform] ?? variantClasses.neutral
      : variantClasses[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm text-xs font-medium px-2 py-0.5 border',
        colorClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
