import type { DataPoint, SeriesConfig } from '@/components/charts/FinancialChart'

const PALETTE = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

function cleanNumeric(val: string): number | null {
  if (!val) return null
  // Clean currency symbols, commas, parentheses, billion/million multipliers, %, etc.
  let cleaned = val.trim().replace(/\$/g, '').replace(/,/g, '').replace(/%/g, '')
  let multiplier = 1
  if (/b(?:illion)?/i.test(cleaned)) {
    multiplier = 1000
    cleaned = cleaned.replace(/b(?:illion)?/gi, '')
  } else if (/m(?:illion)?/i.test(cleaned)) {
    multiplier = 1
    cleaned = cleaned.replace(/m(?:illion)?/gi, '')
  }

  // Handle accounting negatives: (123) -> -123
  if (/^\((.*)\)$/.test(cleaned)) {
    cleaned = '-' + cleaned.replace(/^\((.*)\)$/, '$1')
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num * multiplier
}

function isYearHeader(header: string): boolean {
  const clean = header.trim().toLowerCase().replace(/['"’]/g, '')
  return (
    /^(?:20\d\d|19\d\d)$/.test(clean) ||
    /^fy\s*(?:20)?\d\d$/.test(clean) ||
    /^fiscal\s+(?:20)?\d\d$/.test(clean)
  )
}

export type ParsedChart = {
  title?: string
  data: DataPoint[]
  series: SeriesConfig[]
  valuePrefix?: string
  valueSuffix?: string
}

export function parseMarkdownTableForChart(markdown: string): ParsedChart | null {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean)
  const tableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'))

  if (tableLines.length < 3) return null

  // Parse header
  const headers = tableLines[0]
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim())

  if (headers.length < 2) return null

  // Parse data rows (skip separator row at index 1)
  const rows: string[][] = []
  for (let i = 2; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    if (cells.length === headers.length) {
      rows.push(cells)
    }
  }

  if (rows.length === 0) return null

  // Check Pattern 1: Columns are Years (e.g. Header: [Product/Segment, 2021, 2022, 2023, 2024, 2025])
  const yearCols = headers.map((h, idx) => ({ idx, isYear: isYearHeader(h) })).filter((h) => h.isYear)

  if (yearCols.length >= 2) {
    const dataPoints: DataPoint[] = yearCols.map((yc) => {
      const yearLabel = headers[yc.idx].replace(/^(?:fy|fiscal)\s*/i, '')
      const pt: DataPoint = { label: yearLabel }
      return pt
    })

    const seriesConfigs: SeriesConfig[] = []

    rows.forEach((row, rIdx) => {
      const seriesName = row[0] || `Series ${rIdx + 1}`
      const seriesKey = `s_${rIdx}`

      seriesConfigs.push({
        key: seriesKey,
        label: seriesName,
        color: PALETTE[rIdx % PALETTE.length],
      })

      yearCols.forEach((yc, yIdx) => {
        const val = cleanNumeric(row[yc.idx])
        if (val !== null) {
          dataPoints[yIdx][seriesKey] = val
        }
      })
    })

    return {
      data: dataPoints,
      series: seriesConfigs,
      valuePrefix: '$',
    }
  }

  // Check Pattern 2: Rows are Years (e.g. Column 0 is Year: 2021, 2022, 2023...)
  const isRowYear = rows.every((r) => isYearHeader(r[0]))
  if (isRowYear && rows.length >= 2) {
    const dataPoints: DataPoint[] = []
    const seriesConfigs: SeriesConfig[] = []

    for (let c = 1; c < headers.length; c++) {
      seriesConfigs.push({
        key: `c_${c}`,
        label: headers[c],
        color: PALETTE[(c - 1) % PALETTE.length],
      })
    }

    rows.forEach((row) => {
      const pt: DataPoint = { label: row[0].replace(/^(?:fy|fiscal)\s*/i, '') }
      for (let c = 1; c < headers.length; c++) {
        const val = cleanNumeric(row[c])
        if (val !== null) {
          pt[`c_${c}`] = val
        }
      }
      dataPoints.push(pt)
    })

    return {
      data: dataPoints,
      series: seriesConfigs,
      valuePrefix: '$',
    }
  }

  return null
}
