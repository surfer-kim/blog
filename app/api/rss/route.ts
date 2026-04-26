import { getAllPages } from '@/lib/notion'
import siteConfig from '@/site.config'

export const revalidate = 60

export async function GET(): Promise<Response> {
  const baseUrl = `https://${siteConfig.domain}`
  const pages = await getAllPages()

  const items = pages
    .map((page) => {
      const url = `${baseUrl}/${page.slug}`
      const pubDate = page.date ? new Date(page.date).toUTCString() : ''

      return `
    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${page.description ? `<description>${escapeXml(page.description)}</description>` : ''}
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteConfig.description ?? siteConfig.name)}</description>
    <language>en</language>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `s-maxage=60, stale-while-revalidate`,
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
