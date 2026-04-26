export type SiteConfig = {
  // The root Notion page ID — set this to your public Notion page URL's last segment
  // e.g. https://notion.so/My-Blog-1234abcd1234abcd → "1234abcd1234abcd"
  rootNotionPageId: string

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
  rootNotionPageId: '', // TODO: set your Notion page ID
  name: 'Blog',
  domain: 'localhost:3000',
  author: '',
  description: '',
  social: {},
  pageSize: 10,
  revalidateSeconds: 60,
}

export default config
