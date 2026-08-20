import { useMemo, useState } from 'react'
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DataPoint = {
  label: string // e.g. "2021", "2022", "2023", "2024", "2025"
  [key: string]: string | number
}

export type SeriesConfig = {
  key: string
  label: string
  color: string
}

export type FinancialChartProps = {
  title?: string
  subtitle?: string
  data: DataPoint[]
  series: SeriesConfig[]
  defaultType?: 'area' | 'bar' | 'line'
  className?: string
  valuePrefix?: string
  valueSuffix?: string
}

const PALETTE = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export function FinancialChart({
  title,
  subtitle,
  data,
  series,
  defaultType = 'area',
  className,
  valuePrefix = '$',
  valueSuffix = '',
}: FinancialChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>(defaultType)
  const [activeSeries, setActiveSeries] = useState<string[]>(series.map((s) => s.key))
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Filter series based on active selection
  const visibleSeries = useMemo(
    () => series.filter((s) => activeSeries.includes(s.key)),
    [series, activeSeries],
  )

  // Calculate scales
  const { maxValue, minValue } = useMemo(() => {
    let max = 0
    let min = 0
    for (const d of data) {
      for (const s of visibleSeries) {
        const val = typeof d[s.key] === 'number' ? (d[s.key] as number) : parseFloat(String(d[s.key])) || 0
        if (val > max) max = val
        if (val < min) min = val
      }
    }
    return {
      maxValue: max === 0 ? 100 : max * 1.15,
      minValue: min < 0 ? min * 1.15 : 0,
    }
  }, [data, visibleSeries])

  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((k) => k !== key) : prev
      }
      return [...prev, key]
    })
  }

  // SVG Chart Geometry
  const width = 640
  const height = 240
  const padding = { top: 20, right: 24, bottom: 32, left: 52 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getY = (val: number) => {
    const range = maxValue - minValue || 1
    const normalized = (val - minValue) / range
    return padding.top + chartHeight - normalized * chartHeight
  }

  // Formatting helpers
  const formatVal = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `${valuePrefix}${(val / 1000).toFixed(1)}k${valueSuffix}`
    }
    return `${valuePrefix}${val.toLocaleString(undefined, { maximumFractionDigits: 1 })}${valueSuffix}`
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs backdrop-blur-xs transition-all',
        className,
      )}
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div>
          {title ? (
            <h4 className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {title}
            </h4>
          ) : null}
          {subtitle ? (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={cn(
              'rounded-md p-1 text-xs transition-colors',
              chartType === 'area'
                ? 'bg-background font-medium text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Area chart"
            aria-label="Area chart"
          >
            <AreaChartIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={cn(
              'rounded-md p-1 text-xs transition-colors',
              chartType === 'bar'
                ? 'bg-background font-medium text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Bar chart"
            aria-label="Bar chart"
          >
            <BarChart3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={cn(
              'rounded-md p-1 text-xs transition-colors',
              chartType === 'line'
                ? 'bg-background font-medium text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Line chart"
            aria-label="Line chart"
          >
            <LineChartIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Series Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3">
        {series.map((s, idx) => {
          const color = s.color || PALETTE[idx % PALETTE.length]
          const isSelected = activeSeries.includes(s.key)
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all',
                isSelected
                  ? 'border border-border/80 bg-background text-foreground shadow-2xs'
                  : 'border border-transparent bg-muted/40 text-muted-foreground opacity-60 hover:opacity-100',
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '240px' }}
        >
          <defs>
            {visibleSeries.map((s, idx) => {
              const color = s.color || PALETTE[idx % PALETTE.length]
              return (
                <linearGradient
                  key={s.key}
                  id={`grad-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + chartHeight * (1 - pct)
            const val = minValue + (maxValue - minValue) * pct
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  className="fill-muted-foreground"
                >
                  {formatVal(val)}
                </text>
              </g>
            )
          })}

          {/* X Axis Labels */}
          {data.map((d, index) => {
            const x = getX(index)
            return (
              <text
                key={d.label}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill="currentColor"
                className="fill-muted-foreground"
              >
                {d.label}
              </text>
            )
          })}

          {/* Bar Chart Mode */}
          {chartType === 'bar' &&
            data.map((d, dIdx) => {
              const groupX = getX(dIdx)
              const groupWidth = Math.min(chartWidth / data.length * 0.75, 48)
              const barWidth = groupWidth / visibleSeries.length
              const startX = groupX - groupWidth / 2

              return (
                <g key={d.label}>
                  {visibleSeries.map((s, sIdx) => {
                    const color = s.color || PALETTE[sIdx % PALETTE.length]
                    const rawVal =
                      typeof d[s.key] === 'number'
                        ? (d[s.key] as number)
                        : parseFloat(String(d[s.key])) || 0
                    const y = getY(rawVal)
                    const barHeight = Math.max(0, getY(0) - y)
                    const isHovered = hoveredIndex === dIdx

                    return (
                      <rect
                        key={s.key}
                        x={startX + sIdx * barWidth}
                        y={y}
                        width={Math.max(2, barWidth - 2)}
                        height={barHeight}
                        rx="3"
                        fill={color}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-200"
                      />
                    )
                  })}
                </g>
              )
            })}

          {/* Area & Line Chart Mode */}
          {(chartType === 'area' || chartType === 'line') &&
            visibleSeries.map((s, sIdx) => {
              const color = s.color || PALETTE[sIdx % PALETTE.length]
              const points = data.map((d, dIdx) => {
                const rawVal =
                  typeof d[s.key] === 'number'
                    ? (d[s.key] as number)
                    : parseFloat(String(d[s.key])) || 0
                return { x: getX(dIdx), y: getY(rawVal), val: rawVal }
              })

              const linePath = points.reduce((acc, pt, i) => {
                return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
              }, '')

              const areaPath = `${linePath} L ${points[points.length - 1].x} ${getY(0)} L ${points[0].x} ${getY(0)} Z`

              return (
                <g key={s.key}>
                  {chartType === 'area' ? (
                    <path
                      d={areaPath}
                      fill={`url(#grad-${s.key})`}
                      className="transition-all duration-300"
                    />
                  ) : null}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                  {points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIndex === pIdx ? 4.5 : 3}
                      fill={color}
                      stroke="white"
                      strokeWidth="1.5"
                      className="transition-all"
                    />
                  ))}
                </g>
              )
            })}

          {/* Hover Overlay Columns */}
          {data.map((d, dIdx) => {
            const x = getX(dIdx)
            const colWidth = chartWidth / data.length
            return (
              <rect
                key={d.label}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(dIdx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              />
            )
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredIndex !== null && data[hoveredIndex] ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs shadow-xs">
            <span className="font-semibold text-foreground">
              {data[hoveredIndex].label}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {visibleSeries.map((s, idx) => {
                const color = s.color || PALETTE[idx % PALETTE.length]
                const val = data[hoveredIndex][s.key]
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-muted-foreground">{s.label}:</span>
                    <span className="font-mono font-medium text-foreground">
                      {typeof val === 'number'
                        ? formatVal(val)
                        : String(val ?? '—')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
