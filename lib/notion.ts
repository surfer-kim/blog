import { NotionAPI } from 'notion-client'
import type {
  Block,
  ExtendedRecordMap,
  NotionMapBox,
  SearchParams,
  SearchResults,
} from 'notion-types'
import { getBlockTitle, getPageProperty, idToUuid, uuidToId } from 'notion-utils'

import siteConfig from '@/site.config'

// exactOptionalPropertyTypes: only pass defined values to avoid undefined → string mismatch
const notionOpts: ConstructorParameters<typeof NotionAPI>[0] = {}
if (process.env.NOTION_API_SECRET) notionOpts.authToken = process.env.NOTION_API_SECRET
if (process.env.NOTION_ACTIVE_USER) notionOpts.activeUser = process.env.NOTION_ACTIVE_USER

export const notion = new NotionAPI(notionOpts)

export type PageMeta = {
  id: string           // Notion page ID (no dashes)
  title: string
  slug: string         // URL slug (from Slug property or derived from title)
  date: string | null  // ISO date string from Date property
  description: string | null
  cover: string | null
}

// Fetch a single Notion page's RecordMap
export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  return notion.getPage(pageId)
}

// Fetch all child pages of the root Notion page and return their metadata
export async function getAllPages(): Promise<PageMeta[]> {
  const rootPageId = idToUuid(siteConfig.rootNotionPageId)
  const recordMap = await notion.getPage(rootPageId)

  const pages: PageMeta[] = []

  for (const blockBox of Object.values(recordMap.block)) {
    if (!blockBox) continue
    const block = unwrapBlock(blockBox)
    // Only include page blocks
    if (block.type !== 'page') continue
    // Skip the root page itself
    if (uuidToId(block.id) === siteConfig.rootNotionPageId) continue
    // Skip untitled pages
    const title = getBlockTitle(block, recordMap)
    if (!title) continue

    const rawSlug = getPageProperty<string>('Slug', block, recordMap)
    const slug = rawSlug?.trim() ? rawSlug.trim() : titleToSlug(title)

    const dateRaw = getPageProperty<number>('Date', block, recordMap)
    const date = dateRaw ? new Date(dateRaw).toISOString() : null
    const description = getPageProperty<string>('Description', block, recordMap) ?? null
    const cover = block.format?.page_cover ?? null

    pages.push({
      id: uuidToId(block.id),
      title,
      slug,
      date,
      description,
      cover: typeof cover === 'string' ? cover : null,
    })
  }

  // Sort newest-first; pages without a date go to the end
  return pages.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}

// NotionMapBox<Block>.value is Block | { role; value: Block } — unwrap the nested form
function unwrapBlock(box: NotionMapBox<Block>): Block {
  const v = box.value
  // The nested wrapper has no `type` field; all real Block variants require `type`
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
