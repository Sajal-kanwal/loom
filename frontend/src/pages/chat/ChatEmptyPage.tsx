import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, TrendingUp, ShieldAlert, Cpu, BarChart2 } from 'lucide-react'

import { LogoMark } from '@/components/Logo'
import { Badge } from '@/components/ui/badge'
import { useThreads } from '@/hooks/useThreads'
import { animateStaggerEntrance } from '@/lib/animations'
import { RESEARCH_PROMPTS } from '@/lib/suggestions'
import { cn } from '@/lib/utils'

const TICKERS = ['ALL', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'] as const

const CATEGORY_ICONS = {
  'Revenue Mix': BarChart2,
  'Segment Margins': TrendingUp,
  'AI & Cloud': Cpu,
  'Risk Factors': ShieldAlert,
  'CapEx': TrendingUp,
}

export function ChatEmptyPage() {
  const navigate = useNavigate()
  const { createNewThread } = useThreads()
  const [isStarting, setIsStarting] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState<string>('ALL')
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  const filteredPrompts = useMemo(() => {
    if (selectedTicker === 'ALL') return RESEARCH_PROMPTS
    return RESEARCH_PROMPTS.filter(
      (p) => p.ticker === selectedTicker || p.ticker === 'ALL',
    )
  }, [selectedTicker])

  useEffect(() => {
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll<HTMLElement>('.prompt-card')
      animateStaggerEntrance(cards)
    }
  }, [selectedTicker])

  async function startConversation(prompt: string) {
    if (isStarting) return
    setIsStarting(true)
    try {
      const id = await createNewThread()
      navigate(`/chats/${id}`, { state: { initialPrompt: prompt } })
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark className="size-12 shadow-sm" />
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Loom Research Copilot
          </h1>
          <p className="max-w-lg text-xs sm:text-sm text-muted-foreground">
            Institutional research assistant for SEC 10-K filings. Grounded answers,
            verifiable chunk citations, and normalized table visualizations.
          </p>
        </div>
      </div>

      {/* Ticker Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {TICKERS.map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => setSelectedTicker(ticker)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all',
              selectedTicker === ticker
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {ticker === 'ALL' ? 'All Coverage' : ticker}
          </button>
        ))}
      </div>

      {/* Prompt Cards Grid */}
      <div ref={cardsContainerRef} className="grid w-full gap-2.5 sm:grid-cols-2">
        {filteredPrompts.slice(0, 6).map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Sparkles
          return (
            <button
              key={item.title}
              type="button"
              disabled={isStarting}
              onClick={() => void startConversation(item.prompt)}
              className="prompt-card group flex flex-col justify-between gap-2.5 rounded-xl border border-border/70 bg-card/50 p-4 text-left shadow-2xs transition-all hover:border-border hover:bg-muted/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {item.ticker}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-medium text-foreground/80 group-hover:text-foreground transition-colors pt-1">
                <span>Investigate filing</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
