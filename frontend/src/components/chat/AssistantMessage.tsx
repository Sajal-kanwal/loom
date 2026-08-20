import { useMemo, useState } from 'react'
import type { UIMessage } from 'ai'
import { BarChart3, Check, Copy, FileText, Sparkles } from 'lucide-react'

import { AssistantMarkdown } from '@/components/chat/AssistantMarkdown'
import { CitationChip } from '@/components/chat/CitationChip'
import { FinancialChart } from '@/components/charts/FinancialChart'
import { Button } from '@/components/ui/button'
import { parseMarkdownTableForChart } from '@/lib/chart-parser'
import {
  citationsFromMessage,
  textFromMessage,
  type CitationPayload,
} from '@/lib/citations'

type AssistantMessageProps = {
  message: UIMessage
  selectedCitationIndex: number | null
  onSelectCitation: (citation: CitationPayload) => void
  isStreaming?: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => void handleCopy()}
      aria-label="Copy answer"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  )
}

function ExportMemoButton({
  text,
  citations,
}: {
  text: string
  citations: CitationPayload[]
}) {
  const [exported, setExported] = useState(false)

  async function handleExport() {
    const header = `# LOOM RESEARCH BRIEF\n*Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}*\n\n---\n\n`
    const sources =
      citations.length > 0
        ? `\n\n## Verified Filing Citations\n` +
          citations
            .map(
              (c) =>
                `[${c.citationIndex}] **${c.companyName ?? c.ticker}** (${c.form}, Filed ${c.filingDate}, p. ${c.page ?? 'N/A'})\n> "${c.excerpt}"\n`,
            )
            .join('\n')
        : ''

    const fullMemo = `${header}## Executive Summary\n\n${text}${sources}`
    await navigator.clipboard.writeText(fullMemo)
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => void handleExport()}
      aria-label="Export Research Memo"
    >
      {exported ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <FileText className="size-3.5" />
      )}
      <span className="text-[11px]">{exported ? 'Memo Copied!' : 'Export Memo'}</span>
    </Button>
  )
}

export function AssistantMessage({
  message,
  selectedCitationIndex,
  onSelectCitation,
  isStreaming = false,
}: AssistantMessageProps) {
  const text = textFromMessage(message)
  const citations = citationsFromMessage(message)
  const hasNoEvidence = !isStreaming && text.length > 0 && citations.length === 0

  const parsedChart = useMemo(() => {
    if (isStreaming || !text) return null
    return parseMarkdownTableForChart(text)
  }, [text, isStreaming])

  const [showChart, setShowChart] = useState<boolean>(true)

  return (
    <div className="min-w-0 space-y-3">
      {text ? (
        <AssistantMarkdown
          text={text}
          citations={citations}
          selectedCitationIndex={selectedCitationIndex}
          onSelectCitation={onSelectCitation}
        />
      ) : null}

      {/* Interactive Financial Chart visualization when tables/segment trends are parsed */}
      {parsedChart && !isStreaming ? (
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-foreground uppercase">
              <Sparkles className="size-3.5 text-blue-500" />
              Visual Financial Breakdown
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[11px] font-normal"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="size-3 mr-1" />
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </Button>
          </div>
          {showChart ? (
            <FinancialChart
              title="Multi-Year Financial & Segment Trends"
              subtitle="Extracted from verified SEC filing tables"
              data={parsedChart.data}
              series={parsedChart.series}
              defaultType="area"
              valuePrefix={parsedChart.valuePrefix}
            />
          ) : null}
        </div>
      ) : null}

      {isStreaming && text ? (
        <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-sm bg-foreground" />
      ) : null}

      {hasNoEvidence ? (
        <p className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          No filing evidence was found in the corpus to support this query.
        </p>
      ) : null}

      {citations.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            Sources:
          </span>
          {citations.map((citation) => (
            <CitationChip
              key={`${citation.chunkId}-${citation.citationIndex}`}
              citation={citation}
              selected={selectedCitationIndex === citation.citationIndex}
              onSelect={onSelectCitation}
            />
          ))}
        </div>
      ) : null}

      {!isStreaming && text ? (
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
          <CopyButton text={text} />
          <ExportMemoButton text={text} citations={citations} />
        </div>
      ) : null}
    </div>
  )
}
