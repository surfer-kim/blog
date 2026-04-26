import type { Block, ExtendedRecordMap, NotionMapBox } from 'notion-types'
import { getBlockTitle, getPageProperty, uuidToId } from 'notion-utils'

// Returns the public URL path for a given Notion page block within a recordMap.
// react-notion-x calls this for every internal link it renders.
export function mapPageUrl(recordMap: ExtendedRecordMap) {
  return (pageId: string): string => {
    const box = recordMap.block[pageId] ?? recordMap.block[uuidToId(pageId)]
    if (!box) return `/${uuidToId(pageId)}`

    const block = unwrapBlock(box)
    const rawSlug = getPageProperty<string>('Slug', block, recordMap)
    if (rawSlug?.trim()) return `/${rawSlug.trim()}`

    const title = getBlockTitle(block, recordMap)
    if (title) return `/${titleToSlug(title)}`

    return `/${uuidToId(pageId)}`
  }
}

// Rewrites Notion-hosted asset URLs to go through our local proxy,
// avoiding CORS errors and broken hotlinks after Notion URL expiry.
export function mapNotionImageUrl(
  url: string | undefined,
  block: { id: string }
): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('/')) return url
  return `/api/notion/image?url=${encodeURIComponent(url)}&blockId=${block.id}`
}

// NotionMapBox<Block>.value is Block | { role; value: Block } — unwrap the nested form
function unwrapBlock(box: NotionMapBox<Block>): Block {
  const v = box.value
  if (!('type' in v)) return (v as { role: unknown; value: Block }).value
  return v
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
