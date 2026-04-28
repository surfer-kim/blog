# surfer-kim blog

A personal blog built with Next.js 14 and Notion as the headless CMS. Pages are fetched via the unofficial `notion-client`, rendered with `react-notion-x`, and deployed on Vercel with Incremental Static Regeneration.

**Live:** https://surfer-kim.vercel.app

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Notion client | `notion-client` (unofficial) |
| Notion renderer | `react-notion-x` |
| Styling | Tailwind CSS |
| Cache | Redis via Keyv (optional) |
| Deployment | Vercel |

---

## Project structure

```
blog/
├── app/
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Home — renders root Notion page
│   ├── [slug]/page.tsx                   # Blog post detail
│   ├── projects/
│   │   ├── page.tsx                      # Projects list
│   │   └── [slug]/page.tsx               # Project detail
│   ├── surfing/page.tsx                  # Surfing page (YouTube Shorts)
│   ├── about/page.tsx                    # About page
│   └── api/
│       ├── notion/image/route.ts         # Image proxy (resolves Notion S3/attachment URLs)
│       └── rss/route.ts                  # RSS feed
├── components/
│   ├── NotionPage.tsx                    # NotionRenderer wrapper
│   ├── PostList.tsx                      # Paginated post list
│   ├── Sidebar.tsx                       # Site navigation sidebar
│   ├── Header.tsx
│   └── Footer.tsx
├── lib/
│   ├── notion.ts                         # notion-client wrapper, getAllPages, getAllProjects
│   ├── map-page-url.ts                   # Slug mapping + image URL rewriting
│   └── preview-images.ts                 # Preview image generation
├── styles/
│   ├── globals.css                       # Tailwind base
│   └── notion.css                        # react-notion-x overrides
├── site.config.ts                        # Single source of truth for site settings
└── next.config.ts
```

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure your Notion page

Edit `site.config.ts` and set your Notion page IDs:

```ts
const config: SiteConfig = {
  rootNotionPageId: '<your-blog-notion-page-id>',
  projectsNotionPageId: '<your-projects-notion-page-id>', // optional
  name: 'My Blog',
  domain: 'yourdomain.com',
  author: 'Your Name',
  description: 'My personal blog',
}
```

The page ID is the last segment of the Notion page URL:
`https://notion.so/My-Blog-1234abcd1234abcd` → `1234abcd1234abcd`

### 3. Set environment variables

Create a `.env.local` file:

```bash
# Optional: required for private Notion pages
NOTION_API_SECRET=

# Optional: Redis cache to reduce Notion API calls
REDIS_HOST=
REDIS_PASSWORD=

# Optional: analytics
NEXT_PUBLIC_FATHOM_ID=
NEXT_PUBLIC_POSTHOG_ID=
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
pnpm dev          # Start dev server on :3000
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint
pnpm type-check   # tsc --noEmit
```

---

## How it works

### Notion as CMS

`lib/notion.ts` fetches the root Notion page via the unofficial `notion-client`. Child pages become blog posts. Each page can have typed properties (`Slug`, `Published`, `Description`, `Tags`, `Featured`) that control how the post appears on the site.

### Image proxy

Notion stores uploaded files as `attachment://<uuid>:<filename>` — not a real URL. The `/api/notion/image` route resolves these to signed S3 URLs via `notion.getSignedFileUrls` before proxying the image. This also handles URL expiry for Notion-hosted assets.

### Redis caching

When `REDIS_HOST` is set, `RecordMap` responses from Notion are cached in Redis for the ISR revalidation window (default: 60s), reducing redundant API calls on high-traffic pages.

### Incremental Static Regeneration

Pages are statically generated at build time via `generateStaticParams` and revalidated every 60 seconds. The `revalidateSeconds` value in `site.config.ts` controls this interval.

---

## Notion page setup

For blog posts, add these properties to your Notion database:

| Property | Type | Description |
|---|---|---|
| `Slug` | Text | URL path (e.g. `my-first-post`). Auto-generated from title if omitted. |
| `Published` | Date | Publication date. Unpublished posts are hidden. |
| `Description` | Text | Post summary shown in the post list. |
| `Tags` | Multi-select | Tags shown on the post card. |
| `Featured` | Checkbox | Featured posts sort to the top. |

For projects, add `Public` (Checkbox), `URL` (Text), `Start` / `End` (Date) in addition to the above.

---

## Deployment

The project is configured for one-click deployment on Vercel. Set the environment variables in the Vercel dashboard and connect the GitHub repository.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/surfer-kim/blog)
