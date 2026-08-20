# Loom Frontend — SEC Research SPA

The single-page web client for **Loom**, built with React 19, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Key Features

- **Streaming Analyst Chat**: Real-time server-sent events (SSE) chat client via AI SDK with live pipeline state radar.
- **Single-Click Citation Auditing**: Clickable inline `[n]` citation chips that slide over a detailed source passage drawer highlighting anchor and surrounding context chunks.
- **Interactive Financial Charts**: Multi-series SVG/Canvas visual breakdown (Area, Bar, and Line charts) for multi-year segment trends, margins, and revenue shifts.
- **Research Memo Export**: Quick-export institutional briefing summaries formatted with sources directly to clipboard or markdown.
- **Authenticated Sessions**: Supabase Auth with route protection and automatic bearer token injection.

## Development

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
```
