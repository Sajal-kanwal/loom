import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
}

export function LogoMark({ className }: LogoProps) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background shadow-xs transition-transform hover:scale-105',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4.5"
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
        <circle cx="18" cy="18" r="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Loom
        </span>
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          SEC Research Copilot
        </span>
      </div>
    </div>
  )
}
