# blog

A personal blog built with Next.js and Notion as the CMS, inspired by [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit). Notion pages are fetched via the unofficial `notion-client` and rendered with `react-notion-x`.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Notion client | `notion-client` (unofficial) |
| Notion renderer | `react-notion-x` |
| Styling | Tailwind CSS + `styles/notion.css` for Notion overrides |
| Package manager | pnpm |
| Deployment | Vercel |

## Project structure

```
blog/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (fonts, providers)
│   ├── page.tsx            # Home — renders root Notion page
│   ├── [slug]/
│   │   └── page.tsx        # Individual blog post route
│   └── api/
│       ├── notion/[...slug]/route.ts  # Notion proxy (assets)
│       └── rss/route.ts              # RSS feed
├── components/
│   ├── NotionPage.tsx      # Wraps NotionRenderer with site chrome
│   └── ...
├── lib/
│   ├── notion.ts           # notion-client wrapper + getAllPages
│   ├── config.ts           # Typed site config (re-exports site.config.ts)
│   └── map-page-url.ts     # Notion ID → slug mapping
├── styles/
│   ├── globals.css         # Tailwind base + custom resets
│   └── notion.css          # Overrides for react-notion-x classes
├── public/                 # Static assets
├── site.config.ts          # Single source of truth for site settings
├── next.config.js
└── tsconfig.json
```

## site.config.ts — key settings

```ts
export default {
  rootNotionPageId: '<your-notion-page-id>',   // REQUIRED
  rootNotionSpaceId: '<your-notion-space-id>',  // optional, improves perf
  name: 'My Blog',
  domain: 'yourdomain.com',
  author: 'Your Name',
  description: '...',
  // social links, analytics IDs, etc.
}
```

## Environment variables

```
# .env.local
NOTION_API_SECRET=         # Optional: for private Notion pages (official API)
REDIS_HOST=                # Optional: caching layer for preview images
REDIS_PASSWORD=            # Optional
NEXT_PUBLIC_FATHOM_ID=     # Optional: analytics
NEXT_PUBLIC_POSTHOG_ID=    # Optional: analytics
```

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server on :3000
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
```

## Architecture decisions

- **App Router** — use React Server Components for page-level Notion data fetching; keep `react-notion-x` in a `'use client'` wrapper since it needs the DOM.
- **Incremental Static Regeneration** — pages are statically generated at build time and revalidated every 60 s via `revalidate = 60` in `generateStaticParams`.
- **Slug mapping** — `lib/map-page-url.ts` converts Notion page IDs to human-readable slugs using the page's `Slug` property (if present) or auto-generated slugs from the title.
- **No Redux / global state** — data flows top-down through RSC props; client components only receive serialisable data.
- **Tailwind for layout/chrome** — `react-notion-x` owns Notion content styles; Tailwind handles everything else.

## Task-oriented workflow

Work is organized in phases. Create tasks with `TaskCreate` before starting each phase, update them to `in_progress` while working, and mark `completed` when done. Each phase should be a single PR except Phase 1 (scaffolding).

### Phase 1 — Scaffolding
- [ ] Initialize Next.js 14 + TypeScript + Tailwind with pnpm
- [ ] Configure `tsconfig.json`, `next.config.js`, ESLint, Prettier
- [ ] Set up `site.config.ts` skeleton
- [ ] Add `.env.example`

### Phase 2 — Notion integration
- [ ] Install `notion-client`, `notion-types`, `notion-utils`, `react-notion-x`
- [ ] Implement `lib/notion.ts` (getPage, getAllPages)
- [ ] Implement `lib/map-page-url.ts`
- [ ] Add `app/api/notion/[...slug]/route.ts` (asset proxy)

### Phase 3 — Core pages
- [ ] `app/page.tsx` — home page listing posts from root Notion page
- [ ] `app/[slug]/page.tsx` — individual post with ISR
- [ ] `components/NotionPage.tsx` — NotionRenderer wrapper

### Phase 4 — Styling
- [ ] `styles/globals.css` — Tailwind base
- [ ] `styles/notion.css` — Notion content overrides
- [ ] Site header / footer components

### Phase 5 — RSS feed
- [ ] `app/api/rss/route.ts` — generates RSS XML from all Notion pages

### Phase 6 — Performance & polish
- [ ] Preview image generation with `lqip-modern`
- [ ] `next/image` for all images
- [ ] Open Graph / social meta tags
- [ ] Optional Redis caching

### Phase 7 — Deployment
- [ ] Vercel project setup
- [ ] Environment variables in Vercel
- [ ] Custom domain

## Code conventions

- **No default exports** except Next.js pages/layouts (required by the framework).
- **Types over interfaces** for object shapes; interfaces for extension/class contracts.
- **No `any`** — use `unknown` and narrow it.
- Comments only when the **why** is non-obvious.
- Keep Notion-specific logic in `lib/`; React components in `components/`.
