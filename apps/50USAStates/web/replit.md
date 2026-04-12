# Expedition America — Daily Travel & Tour News

## Overview

Expedition America is an autonomous AI-powered travel news platform that generates daily travel and tourism dispatches for all 50 United States. Each day, the system deep-researches what's most important, interesting, and informative happening in each state — festivals, natural wonders, hidden gems, culinary scenes, cultural events, adventure opportunities — and publishes compelling travel journalism powered by live web research and AI synthesis.

The mission: Rediscover America. Understand it. One state at a time.

## Recent Changes

**March 21, 2026**
- **Complete platform transformation**: Rebuilt from PolitIQ political intelligence platform into Expedition America travel news
- **All 50 states**: Generates one featured travel dispatch per state per day
- **Autonomous generation**: "Generate Today's Expedition" button triggers research & publication for all 50 states via SSE streaming with live progress
- **State-specific dispatch**: Individual state pages with full article history and on-demand regeneration
- **Americana color palette**: Deep navy primary, warm amber accent, cream background — adventure magazine aesthetic
- **New data model**: Articles with state, city, category, highlights, sources, publishedDate
- **Seed data**: 6 richly detailed sample articles pre-loaded (NY, TX, CO, LA, AK, SC)
- **Article detail page**: Full markdown dispatch with highlights sidebar and regenerate capability
- **SSE streaming**: Both single-state and all-50-states generation stream progress in real time

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- React 18 with TypeScript
- Vite build tool
- Wouter for routing
- TanStack Query (React Query) for data fetching
- Tailwind CSS + shadcn/ui components

**Pages**
- `/` — Home: hero with "Generate Today's Expedition" button, today's stories grid, all 50 states grid, past dispatches
- `/articles/:id` — Article detail: full dispatch, expedition highlights sidebar, regenerate/delete
- `/state/:code` — State page: all dispatches for a given state, generate new dispatch

**Key Components**
- `Header` — Expedition America branding with compass icon, navigation
- State grid showing all 50 states with news status indicators
- Generation progress bar with live SSE updates
- Category filter buttons for today's stories

### Backend Architecture

**API Endpoints**
- `GET /api/articles` — All articles (sorted by date)
- `GET /api/articles/today` — Today's articles only
- `GET /api/articles/states` — All 50 states with latest article info and hasToday status
- `GET /api/articles/state/:code` — Articles for a specific state
- `GET /api/articles/:id` — Single article
- `DELETE /api/articles/:id` — Delete an article
- `POST /api/articles/generate` — Generate for one state (SSE streaming)
- `POST /api/articles/generate-all` — Generate for all 50 states (SSE streaming with per-state progress)

**Article Generation Pipeline**
1. Validate state code input (Zod schema)
2. Run 4 web searches: travel/tourism, events/festivals, "best places," general travel news
3. Deduplicate results, keep top 12
4. Send to OpenAI gpt-5.2 with travel journalist persona prompt
5. Parse JSON response into structured article
6. Save to in-memory storage
7. Stream SSE events throughout (single state or all-50 progress)

**Storage**
- `DatabaseStorage` class backed by Replit's built-in PostgreSQL (Drizzle ORM)
- `server/db.ts` — Drizzle + pg.Pool connection
- 4 seed articles auto-inserted on first run if DB is empty (NY, TX, LA, SC)
- Methods: getPublishedArticles, getDraftArticles, getArticle, getPublishedByState, getLatestPublishedByState, getArticlesByDate, createArticle, updateArticle, updateArticleStatus, deleteArticle
- Data survives server restarts — fully persistent

**AI Configuration**
- Uses Replit AI Integrations (no user API key required)
- Model: `gpt-5.2` for article generation
- Response format: JSON object with strict schema
- Prompt: Senior travel journalist persona for "Expedition America" publication

### Article Data Model

```typescript
{
  id: string (UUID)
  stateCode: string       // "CA", "TX", etc.
  stateName: string       // "California", "Texas", etc.
  city: string            // Featured city or region
  title: string           // Compelling headline
  summary: string         // 2-3 sentence hook
  content: string         // Full markdown article body (600+ words)
  category: string        // One of 8 travel categories
  highlights: string[]    // 5-6 expedition highlights
  sources: string[]       // 4-6 named research sources
  publishedDate: string   // "2026-03-21"
  createdAt: timestamp
}
```

**Article Categories**
Events & Festivals, Natural Wonders, Food & Culture, History & Heritage, Adventure & Outdoors, Arts & Entertainment, Hidden Gems, Seasonal Highlights

## External Dependencies

### AI
- **OpenAI** (via Replit AI Integrations) — Article generation, gpt-5.2 model

### Search
- **Brave Search API** — Live web research (graceful fallback if not configured)

### UI/Frontend
- **Radix UI / shadcn/ui** — Component library
- **Lucide React** — Icons
- **Tailwind CSS** — Styling

### Backend
- **Express.js** — HTTP server
- **Zod** — Input validation
- **drizzle-zod** — Schema generation
