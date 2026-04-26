export type SiteConfig = {
  // The root Notion page ID — set this to your public Notion page URL's last segment
  // e.g. https://notion.so/My-Blog-1234abcd1234abcd → "1234abcd1234abcd"
  rootNotionPageId: string

  // The root Notion page ID for the projects database
  projectsNotionPageId?: string

  // Optional: improves API performance when set
  rootNotionSpaceId?: string

  name: string
  domain: string
  author: string
  description: string

  // Set to true to serve the site under a /blog sub-path
  // Default: false (served at root)
  blogPath?: string

  // Optional social / profile links
  social?: {
    twitter?: string
    github?: string
    linkedin?: string
    email?: string
    linktree?: string
    youtube?: string
  }

  // Optional analytics
  fathomId?: string
  posthogId?: string

  // Default number of posts shown on the index page
  pageSize?: number

  // ISR revalidation interval in seconds (default: 60)
  revalidateSeconds?: number
}

const config: SiteConfig = {
  rootNotionPageId: '1e2e26538db480f48517d027c4c79b3c',
  projectsNotionPageId: '226e26538db480569adcf98b54a4b3fb',
  name: 'surfer-kim',
  domain: 'https://surfer-kim.vercel.app',
  author: 'Jason Kim',
  description: '',
  social: {
    github: "github.com/surfer-kim",
    linkedin: "linkedin.com/in/surfer-kim",
    linktree: "linktr.ee/surfer_kim",
    youtube: "youtube.com/@surfer-kim"
  },
  pageSize: 10,
  revalidateSeconds: 60,
}

export default config
