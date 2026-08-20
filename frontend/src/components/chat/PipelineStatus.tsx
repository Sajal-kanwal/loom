import { FileSearch, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { type PipelineStatus as PipelineStatusState } from '@/lib/citations'
import { cn } from '@/lib/utils'

type PipelineStatusProps = {
  isSubmitted: boolean
  pipelineStatus: PipelineStatusState | null
}

const STAGES = [
  { id: 'analyzing', label: 'Analyze', icon: Sparkles },
  { id: 'searching', label: 'Hybrid Search', icon: Search },
  { id: 'reading', label: 'Read Chunks', icon: FileSearch },
  { id: 'verifying', label: 'Grounding Audit', icon: ShieldCheck },
]

export function PipelineStatus({ isSubmitted, pipelineStatus }: PipelineStatusProps) {
  const currentStage = pipelineStatus?.stage || (isSubmitted ? 'analyzing' : 'searching')
  const message =
    isSubmitted && !pipelineStatus
      ? 'Analyzing query & distilling keywords…'
      : (pipelineStatus?.message ?? 'Synthesizing evidence…')

  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.id === currentStage),
  )

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs">
      {/* Live animated status message */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-blue-500" />
        </span>
        <p
          aria-live="polite"
          className={cn(
            'bg-clip-text text-xs font-semibold tracking-wide text-transparent uppercase',
            'bg-[linear-gradient(to_right,var(--muted-foreground)_30%,var(--foreground)_50%,var(--muted-foreground)_70%)]',
            'bg-size-[200%_auto]',
            'animate-[shimmer_2.5s_linear_infinite]',
          )}
        >
          {message}
        </p>
      </div>

      {/* Visual Pipeline Progress Steps */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon
          const isDone = idx < activeIdx
          const isActive = idx === activeIdx
          return (
            <div
              key={stage.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-1.5 text-center transition-all duration-300',
                isActive
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                  : isDone
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                    : 'border-border/40 bg-muted/20 text-muted-foreground opacity-50',
              )}
            >
              <Icon className={cn('size-3.5', isActive && 'animate-pulse')} />
              <span className="text-[10px] tracking-tight">{stage.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
