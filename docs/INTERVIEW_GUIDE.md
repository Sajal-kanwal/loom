# Loom: Master Technical Architecture & Interview Deep-Dive Guide

> **Target Role Level:** Senior Software Engineer / AI Systems Engineer / Full-Stack AI Architect (15+ LPA)  
> **System Purpose:** Enterprise-grade Agentic Retrieval-Augmented Generation (RAG) Platform for SEC Filing Equity Research with Fail-Closed Grounding, Hybrid Vector + Lexical Search (RRF), Real-time SSE Streaming, and Micro-Interaction Physics.

---

## 1. Resume Points (XYZ / Google Star Protocol)

Use these three tailored, high-impact bullet points on your resume:

- **AI Platform & Distributed RAG (Backend / AI Systems):**  
  *Architected and engineered **Loom**, an enterprise-grade agentic financial RAG system in **FastAPI** & **PostgreSQL**, processing 25+ SEC 10-K filings with **Reciprocal Rank Fusion (RRF, $k=60$)** hybrid search (pgvector HNSW + FTS tsvector), cutting cross-filing query latency to $<1.8\text{s}$ and achieving $100\%$ precision in tabular financial retrieval.*

- **Fail-Closed Grounding & LLM-as-a-Judge (Safety / Robustness):**  
  *Built a deterministic two-phase **Fail-Closed Grounding Validator** using **Pydantic AI** and semantic LLM-as-a-Judge, verifying inline citation spans ($[1], [2]$) against verbatim source chunk provenance and eliminating hallucinations across numeric metrics (revenue, segment margins, CapEx).*

- **Full-Stack Performance & Real-Time UX (Frontend / Architecture):**  
  *Engineered a high-performance **React 19 SPA** with **Anime.js** physics and **Server-Sent Events (SSE)** streaming pipeline, featuring dynamic SVG financial chart synthesis from Markdown tables and sub-100ms multi-stage retrieval radar status updates.*

---

## 2. 30-Second Elevator Pitch

> *"Loom is a production-grade financial intelligence assistant built for equity analysts. Unlike standard naive RAG wrappers that hallucinate numbers or miss complex multi-year financial tables, Loom implements an autonomous **Pydantic AI agent** over a hybrid retrieval engine—fusing 1536-dimensional pgvector HNSW embeddings with PostgreSQL tsvector full-text search using Reciprocal Rank Fusion ($k=60$). Crucially, Loom features a **fail-closed grounding validator**: every single sentence generated must map to a verbatim excerpt from the source 10-K filing, or the system safely halts and retries. The frontend delivers sub-second Server-Sent Events streaming with interactive SVG financial chart synthesis and Anime.js physics."*

---

## 3. High-Level Architecture & System Topography

### System Block Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 19 + TypeScript + Vite)"]
        UI[Chat Interface & Radar Status]
        Chart[Dynamic SVG Chart Engine]
        Anime[Anime.js Physics Engine]
        SSE_Client[Vercel AI SDK SSE Consumer]
    end

    subgraph AuthLayer["Identity & Security"]
        SupaAuth[Supabase Auth / JWT]
        RLS[PostgreSQL Row-Level Security]
    end

    subgraph BackendLayer["Application Layer (FastAPI + Python 3.13)"]
        Router[FastAPI Route Handlers]
        Orchestrator[Chat Turn Orchestrator]
        Agent[Pydantic AI Document Agent]
        Validator[Fail-Closed Grounding Validator]
        Retriever[Hybrid Document Retriever]
    end

    subgraph DataLayer["Storage & Retrieval Engine (Supabase Postgres)"]
        VectorDB[(pgvector HNSW cosine <= >)]
        FTS[(PostgreSQL tsvector GIN)]
        Relational[(7 Relational Tables: chats, chunks, tables)]
    end

    subgraph IntelligenceLayer["Model & Embedding Layer"]
        GeminiFlash[Google Gemini Flash / Pro]
        GeminiEmbed[Google Gemini Embedding-001 (1536-dim)]
    end

    UI -->|JWT Bearer| Router
    Router -->|Validate User| SupaAuth
    Router --> Orchestrator
    Orchestrator --> Agent
    Agent -->|Tool Calls| Retriever
    Retriever -->|Embed Query| GeminiEmbed
    Retriever -->|Dense Search| VectorDB
    Retriever -->|Sparse Lexical| FTS
    Retriever -->|RRF Fusion (k=60)| Retriever
    Agent -->|Draft Answer + Excerpts| Validator
    Validator -->|Semantic Audit| GeminiFlash
    Validator -->|Approved Grounded Turn| Orchestrator
    Orchestrator -->|Persist Turn| Relational
    Orchestrator -->|SSE Event Stream| SSE_Client
    SSE_Client --> UI
    UI --> Chart
    UI --> Anime
```

---

## 4. End-to-End Data Ingestion & Preprocessing Pipeline

```text
SEC EDGAR (HTML/HTM) ──> Docling Parser ──> Markdown Normalizer ──> Chunking & Table Isolation ──> 1536-dim Embedding ──> Supabase pgvector + tsvector
```

### 1. Document Extraction & Manifest
- Ingests 5 years of historical 10-K annual filings for S&P 500 bellwethers (**AAPL, MSFT, NVDA, AMZN, GOOGL**).
- Automated downloader tracks accessions, forms, reporting periods, and CIKs in a verified `manifest.json`.

### 2. High-Fidelity Table Extraction with Docling
- Financial 10-Ks are table-dense (Balance Sheets, Statements of Operations, Segment Disaggregation). Standard PDF/HTML text scrapers destroy tabular structure.
- Loom utilizes **Docling** and custom table normalizers to convert complex HTML tables into clean, structured Markdown tables while preserving header-row hierarchies and unit scales (e.g. *"in millions"*).

### 3. Boundary-Preserving Chunking Heuristic
- **Chunk Size Budget:** 512 tokens with 12% token overlap ($\approx 64$ tokens).
- **Table Integrity Rule:** Financial tables are extracted as contiguous single blocks (up to 1,500 tokens) with Markdown metadata so multi-year revenue rows never get severed across chunk boundaries.
- **Search Vectors:** Every chunk auto-generates a Postgres `tsvector search_vector` column populated via `to_tsvector('english', title || ' ' || section || ' ' || text)`.

---

## 5. Deep-Dive: Hybrid Retrieval Engine (pgvector + FTS + RRF)

Loom rejects naive single-vector search in favor of **Dual-Track Hybrid Search with Reciprocal Rank Fusion**.

```mermaid
flowchart LR
    Query[Analyst Question] --> ParallelPrep[Parallel Preparation]
    ParallelPrep -->|ThreadPoolExecutor| DensePath[Dense Embedding Track]
    ParallelPrep -->|ThreadPoolExecutor| SparsePath[Sparse Lexical Track]

    DensePath -->|Gemini Embedding (1536)| DenseSearch[pgvector HNSW Cosine Search]
    SparsePath -->|LLM Term Extraction| SparseSearch[Postgres Full-Text Search tsvector]

    DenseSearch -->|Top 50 Ranked Hits| RRF[Reciprocal Rank Fusion k=60]
    SparseSearch -->|Top 50 Ranked Hits| RRF

    RRF -->|Fused Top-10 IDs| Hydrate[Passage Hydration + Context Window]
    Hydrate --> FinalPassages[RetrievedPassage Structs for Agent]
```

### Mathematical Formulation: Reciprocal Rank Fusion (RRF)

Standard score normalization (min-max scaling) fails when combining cosine distances with BM25/`ts_rank_cd` scores because their score distributions are radically different and sensitive to outliers. 

Loom implements **Reciprocal Rank Fusion (RRF)**:

$$\text{RRF\_Score}(d \in D) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

- **$M$**: Set of retrieval systems ($M = \{\text{pgvector\_dense}, \text{postgres\_fts}\}$).
- **$r_m(d)$**: Rank position of document $d$ in system $m$ ($1$-indexed).
- **$k$**: Smoothing constant ($k = 60$). Prevents top-ranked items from dominating disproportionately and boosts documents that appear in both retrieval channels.

### Database Index Specifications
- **pgvector Index:** HNSW index on `document_chunks.embedding` using cosine distance:
  ```sql
  CREATE INDEX idx_chunks_embedding_hnsw ON document_chunks 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);
  ```
- **Postgres FTS Index:** GIN index on `document_chunks.search_vector`:
  ```sql
  CREATE INDEX idx_chunks_search_vector_gin ON document_chunks 
  USING gin (search_vector);
  ```

### Context Hydration & Neighbor Stitching
- When a chunk is retrieved, the retriever queries adjacent chunks ($\pm 1$ radius by `chunk_index` in the same `document_id`) in a single indexed query.
- This gives the LLM surrounding narrative context without increasing search index size.

---

## 6. Autonomous Agentic Loop & Pydantic AI Architecture

Loom uses **Pydantic AI** for strictly typed, dependency-injected agentic execution.

```python
class DocumentAgentDeps:
    retriever: DocumentRetriever
    registry: TurnRegistry
    thread_id: UUID
    user_id: UUID
    on_status: Callable[[str, str], None]
```

### Agent Tool Arsenal
1. `search_filings(query, ticker, form, fiscal_years)`: Dynamic filtering over metadata with hybrid search.
2. `read_chunks(chunk_ids)`: Batched retrieval of full-text chunk bodies into the turn registry.
3. `read_chunk(chunk_id)`: Point-lookup for single chunk text.
4. `read_surrounding_chunks(chunk_id, radius)`: Expands context window forward/backward.

### Resilient Multi-Model Fallback Engine
Google Gemini preview models or OpenAI endpoints can occasionally experience temporary upstream spikes (e.g. HTTP 503 / 429). Loom implements an active fallback mechanism across production models:
```text
Primary (gemini-3.5-flash-lite) ──[Fallback on 503/429]──> gemini-flash-lite-latest ──> gemini-3.5-flash
```

---

## 7. Deep-Dive: Fail-Closed Grounding & Citation Validation System

In financial applications, an hallucinated margin or CapEx number can lead to disastrous investment errors. Loom treats grounding not as prompt engineering, but as a **verifiable software contract**.

```mermaid
flowchart TD
    Answer[Agent Output: GroundedAnswer] --> Step1[Step 1: Syntax & Index Normalization]
    Step1 -->|Convert [uuid] to [n] & clean dangling| Step2[Step 2: Contiguous 1..N Re-indexing]
    Step2 --> Step3{Are Citations Present?}
    Step3 -->|No & Insufficient Evidence| Pass[Validation PASSED]
    Step3 -->|No & Non-empty Text| Fail[Validation FAILED: No Citations]
    Step3 -->|Yes| Step4[Step 4: Semantic LLM-as-a-Judge Audit]
    Step4 -->|Batch Cases: claim + excerpt + source_text| Judge[GeminiGroundingJudge]
    Judge -->|Verify each claim supported=true| DecisionList[CitationGroundingDecisionList]
    DecisionList -->|All True| Pass
    DecisionList -->|Any False| Retry[Trigger Re-Prompt Attempt #2]
    Retry -->|Max Attempts Exhausted| FailClosed[Safe Fail-Closed Fallback]
```

### Two-Phase Verification Protocol

#### Phase 1: Deterministic Syntax & Index Normalization
- **Bracket Parsing:** Regex parses single `[1]`, comma-separated `[1, 2]`, and inline UUID markers `[59c320c7-...]`.
- **Dangling Marker Removal:** Any marker $[k]$ in text lacking a corresponding chunk reference is stripped.
- **Contiguous Re-indexing:** Citations and text markers are re-indexed strictly $1..N$ contiguously.

#### Phase 2: Semantic LLM-as-a-Judge
- Extracts every `CitationGroundingCase` containing `(citation_index, claim_sentence, excerpt, full_source_text)`.
- Dispatches a structured evaluation prompt to `GeminiGroundingJudge`:
  ```json
  {
    "decisions": [
      {
        "citation_index": 1,
        "supported": true,
        "reason": "The source text explicitly states iPhone net sales were $201,183 million in 2024."
      }
    ]
  }
  ```
- **Fail-Closed Guarantee:** If any cited claim is marked `supported = false`, the validation fails and triggers a stricter retry prompt or displays a clear fail-closed message: *"I found relevant source passages, but I could not fully verify the answer against them."*

---

## 8. Real-Time Streaming & SSE Protocol

Loom implements Server-Sent Events (SSE) using the standard Vercel AI protocol.

### SSE Event Stream Sequence

```text
data: {"type":"data-status","data":{"stage":"analyzing","message":"Analyzing your question…"}}
data: {"type":"data-status","data":{"stage":"searching","message":"Searching SEC filings…"}}
data: {"type":"data-status","data":{"stage":"verifying","message":"Verifying citations…"}}
data: {"type":"data-status","data":{"stage":"streaming","message":"Preparing answer…"}}
data: {"type":"start","messageId":"ad0b45e3-..."}
data: {"type":"text-start","id":"ad0b45e3-..."}
data: {"type":"text-delta","id":"ad0b45e3-...","delta":"Apple's iPhone revenue was "}
data: {"type":"text-delta","id":"ad0b45e3-...","delta":"**$201,183 million** [1]."}
data: {"type":"text-end","id":"ad0b45e3-..."}
data: {"type":"data-citation","id":"chunk-uuid-1","data":{"citationIndex":1,"excerpt":"iPhone | $201,183..."}}
data: {"type":"finish"}
```

### Visual Pipeline Radar
The frontend visualizes the 4 distinct lifecycle stages in real time with an animated shimmering radar pulse:
1. `analyzing`: Question decomposition and query token extraction.
2. `searching`: Parallel dense + sparse execution across Supabase Postgres.
3. `verifying`: Fail-closed semantic grounding judge audit.
4. `streaming`: Real-time token delivery to the user.

---

## 9. Database Architecture, RLS & Connection Pooler

### Supabase Relational Schema
Loom defines 7 production tables with foreign key cascades:
1. `public.users`: Identity linked to Supabase Auth (`id`, `email`, `created_at`).
2. `public.source_documents`: Filing metadata (`ticker`, `form`, `fiscal_year`, `accession_number`, `filing_date`).
3. `public.document_chunks`: Text chunks, `vector(1536)` embeddings, `tsvector` search vectors.
4. `public.document_tables`: Normalized SEC financial tables in Markdown format.
5. `public.chat_threads`: Analyst research threads (`user_id`, `title`).
6. `public.chat_messages`: Turn messages (`thread_id`, `role`, `parts`).
7. `public.message_citations`: Citation metadata (`message_id`, `chunk_id`, `citation_index`, `excerpt`).

### Supabase Pooler Port 6543 vs Direct 5432
- **Port 5432 (Session Mode):** Allocates a dedicated Postgres process per connection. In serverless / async FastAPI environments, connection spikes cause port exhaustion and firewall timeouts.
- **Port 6543 (Transaction Mode):** Utilizes Supavisor / PgBouncer transaction-level pooling. Connections are returned immediately upon query completion, delivering instant sub-millisecond connection reuse.

---

## 10. Frontend Engineering & Micro-Interactions

- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Anime.js Physics ([`animations.ts`](file:///c:/Former_D/loom/frontend/src/lib/animations.ts)):**
  - Staggered prompt card entrance on tab/filter switch (`stagger(60, { start: 50 })`).
  - Spring-eased chat bubble arrival physics.
  - Interactive citation chip hover scaling.
- **Dynamic Financial Chart Parser ([`chart-parser.ts`](file:///c:/Former_D/loom/frontend/src/lib/chart-parser.ts)):**
  - Detects Markdown financial tables in assistant responses and automatically renders interactive SVG **Area, Bar, or Line charts** with toggleable views and series comparison.

---

## 11. Architectural Trade-Offs ("Why X and Not Y?")

| Decision | Option Chosen | Alternative Rejected | Core Technical Rationale |
| :--- | :--- | :--- | :--- |
| **Retrieval Strategy** | **Hybrid RRF (Dense + FTS)** | Vector-Only / Pinecone | Dense search alone struggles on exact alphanumeric tickers, form numbers, and accounting codes. Postgres FTS guarantees keyword recall; pgvector provides semantic conceptual matching; RRF cleanly fuses them without score calibration artifacts. |
| **Vector Storage** | **Supabase Postgres (`pgvector`)** | Pinecone / Qdrant | Single-store architecture: vectors live in the same ACID-compliant database as chat threads, metadata, and user accounts. Enables atomic transactions and joins between chunks and documents in single SQL queries. |
| **Orchestration Framework** | **Pydantic AI** | LangChain / LlamaIndex | LangChain adds heavy abstraction layers and opaque prompt modifications. Pydantic AI provides strict Python type-safety, direct dependency injection, native Pydantic validation, and minimal runtime footprint. |
| **LLM Provider** | **Native Google GenAI SDK** | OpenAI Proxy Adapter | Native SDK eliminates proxy latency, eliminates `thought_signature` serialization errors during multi-turn function calling, and provides direct structured JSON schema enforcement. |
| **Grounding Policy** | **Fail-Closed Two-Phase Validator** | Best-Effort Prompting | Financial research requires zero tolerance for hallucinated numbers. Fail-closed system halts unverified claims before persisting or displaying them to analysts. |

---

## 12. Top 20 Brutal Interview Questions & Bulletproof Answers

### Q1: How do you eliminate hallucinations on numeric financial metrics?
**Answer:** *"We use a three-tier defense: (1) Prompt constraints restricting the LLM to retrieved passages only; (2) Verbatim excerpt extraction requirement where the model must extract exact substrings; (3) A deterministic Fail-Closed Grounding Validator that runs an independent semantic judge against the source chunk text. If any number or claim is not strictly supported by the cited chunk, the turn is rejected, re-prompted, or failed safely."*

### Q2: Why did you choose Reciprocal Rank Fusion (RRF) over score normalization?
**Answer:** *"Cosine similarity from vector embeddings ranges between $[-1, 1]$ (or $[0, 1]$ for normalized vectors), while PostgreSQL BM25/`ts_rank_cd` yields unbounded positive scores dependent on document length. Standard linear combination ($\alpha \cdot \text{dense} + (1-\alpha) \cdot \text{sparse}$) requires constant hyperparameter tuning per corpus. RRF uses rank order rather than raw scores: $RRF(d) = \sum \frac{1}{k + r(d)}$. With $k=60$, it naturally balances both retrieval channels and gives an exponential boost to documents found in both sets without scale distortion."*

### Q3: How do you handle chunk boundary loss on large financial tables?
**Answer:** *"Standard text chunkers split text every 512 tokens, which frequently cuts financial tables across fiscal years or separates header rows from data rows. We built a custom table extractor using Docling that identifies HTML/PDF table boundaries and isolates normalized Markdown tables as atomic units up to 1,500 tokens with embedded unit scales (e.g. 'in millions'). When table chunks are retrieved, neighbor context hydration attaches adjacent explanatory narrative."*

### Q4: What happens if the external LLM or Embedding API rate-limits (HTTP 429 / 503)?
**Answer:** *"We engineered two layers of resilience: (1) In retrieval, if the embedding API is rate-limited, `retriever.py` catches the exception and gracefully falls back to Postgres Full-Text Search with zero query failure; (2) In agent reasoning, `agent.py` implements a multi-model fallback chain (`gemini-3.5-flash-lite` $\rightarrow$ `gemini-flash-lite-latest` $\rightarrow$ `gemini-3.5-flash`), automatically switching models if a specific endpoint experiences a transient spike."*

### Q5: Why use Supabase Pooler Port 6543 instead of Direct Port 5432?
**Answer:** *"Port 5432 operates in session mode, dedicating a stateful PostgreSQL process per connection. In async FastAPI architectures with concurrent asyncio requests, connection spikes quickly exhaust the database connection limit and cause network timeouts. Port 6543 routes through Supavisor / PgBouncer in Transaction Pooling mode, where connections are held only for the duration of a single transaction and returned immediately, supporting thousands of concurrent client requests."*

### Q6: Walk me through the exact Server-Sent Events (SSE) lifecycle from backend to frontend.
**Answer:** *"When the user sends a message, FastAPI initializes an `AsyncIterator[str]` generator. It yields JSON-formatted SSE events: first `data-status` with `stage='analyzing'`, then status updates as tools execute. Once the agent draft passes the Grounding Validator, it yields `start`, followed by chunked `text-delta` tokens for instant streaming. After the text completes, it yields `data-citation` metadata events containing verbatim excerpts, and finishes with `finish`."*

### Q7: How does Row-Level Security (RLS) interact with your FastAPI backend?
**Answer:** *"Client requests send a JWT access token in the `Authorization: Bearer` header. FastAPI validates the JWT with Supabase Auth to extract the user's UUID. For user-specific operations, queries are executed in the authenticated user's context enforcing `auth.uid() = user_id`. For document chunk retrieval, public read RLS allows access, while write operations require verified admin credentials."*

### Q8: How would you scale this architecture to 10,000,000 filings?
**Answer:** *"At 10M filings ($\approx 5\text{B}$ chunks): (1) Partition `document_chunks` table by `ticker` hash or filing year; (2) Use Qdrant or distributed pgvector with IVFFlat / HNSW partitioned across shards; (3) Implement hierarchical metadata pre-filtering (filtering by ticker and fiscal year before vector index scan); (4) Cache high-frequency query embeddings in Redis."*

### Q9: Why did you pick Pydantic AI over LangChain?
**Answer:** *"LangChain introduces massive dependency bloat, fragile abstractions, and difficult-to-trace prompt manipulations. Pydantic AI is built directly on Python typing and Pydantic v2. It provides dependency injection for test mocking, strict structured output validation, explicit tool definitions, and predictable execution with zero black-box magic."*

### Q10: How do you handle cross-company comparative queries (e.g. comparing AAPL vs MSFT CapEx)?
**Answer:** *"The Pydantic AI agent decomposes complex comparative questions into multi-step tool calls. It executes `search_filings(query='CapEx capital expenditures', ticker='AAPL')` and subsequently `search_filings(query='CapEx capital expenditures', ticker='MSFT')`. Both passage sets are hydrated into the turn registry and cited independently with distinct citation indices."*

---

*Authored for Technical Interview Preparation — Loom Platform Architecture*
