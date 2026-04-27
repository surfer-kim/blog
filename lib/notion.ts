import Keyv from '@keyvhq/core'
import KeyvRedis from '@keyvhq/redis'
import { NotionAPI } from 'notion-client'
import type {
  Block,
  CollectionPropertySchemaMap,
  ExtendedRecordMap,
  FormattedDate,
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

// Optional Redis cache — only active when REDIS_HOST is set.
// Reduces Notion API calls by caching RecordMaps for the ISR window.
const cache: Keyv<ExtendedRecordMap> | null =
  process.env.REDIS_HOST
    ? new Keyv<ExtendedRecordMap>({
      store: new KeyvRedis(
        `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST}`
      ),
      ttl: (siteConfig.revalidateSeconds ?? 60) * 1000,
      namespace: 'notion',
    })
    : null

export type PageMeta = {
  id: string
  slug: string
  title: string
  description: string | null
  cover: string | null
  featured: boolean
  published: string | null  // "YYYY-MM-DD"
  tags: string[]
}

export type ProjectMeta = {
  id: string
  slug: string
  title: string
  description: string | null
  public: boolean
  featured: boolean
  published: string
  url: string | null
  tags: string[]
  cover: string | null
  start: string | null  // "YYYY-MM-DD"
  end: string | null    // "YYYY-MM-DD"
}

// Fetch a single Notion page's RecordMap, with optional Redis caching
export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  if (cache) {
    const cached = await cache.get(pageId)
    if (cached) return cached
  }

  const recordMap = await notion.getPage(pageId)

  if (cache) {
    await cache.set(pageId, recordMap)
  }

  return recordMap
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

    const featured = readCheckbox('Featured', block, recordMap)
    const published = tsToDateStr(getPageProperty<number>('Published', block, recordMap))
    const description = getPageProperty<string>('Description', block, recordMap) ?? null
    const blockNodashId = uuidToId(block.id)
    const rawCover = block.format?.page_cover ?? null
    // Resolve attachment:// covers to signed S3 URLs the same way getAllProjects() does
    const cover =
      typeof rawCover === 'string'
        ? (recordMap.signed_urls?.[blockNodashId] ?? rawCover)
        : null
    const rawTags = getPageProperty<unknown>('Tags', block, recordMap)
    const tags = Array.isArray(rawTags)
      ? (rawTags as string[]).map((t) => t.trim()).filter(Boolean)
      : typeof rawTags === 'string' && rawTags
        ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

    pages.push({
      id: blockNodashId,
      slug,
      title,
      description,
      cover: typeof cover === 'string' ? cover : null,
      featured,
      published,
      tags,
    })
  }

  // Featured first, then newest by Published date
  return pages.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (!a.published && !b.published) return 0
    if (!a.published) return 1
    if (!b.published) return -1
    return b.published.localeCompare(a.published)
  })
}

// Fetch all child pages of the projects Notion page and return their metadata
export async function getAllProjects(): Promise<ProjectMeta[]> {
  if (!siteConfig.projectsNotionPageId) return []

  const rootPageId = idToUuid(siteConfig.projectsNotionPageId)
  const recordMap = await notion.getPage(rootPageId)

  const projects: ProjectMeta[] = []

  for (const blockBox of Object.values(recordMap.block)) {
    if (!blockBox) continue
    const block = unwrapBlock(blockBox)
    if (block.type !== 'page') continue
    if (uuidToId(block.id) === siteConfig.projectsNotionPageId) continue
    const title = getBlockTitle(block, recordMap)
    if (!title) continue

    const isPublic = readCheckbox('Public', block, recordMap)
    if (!isPublic) continue

    const rawSlug = getPageProperty<string>('Slug', block, recordMap)
    const slug = rawSlug?.trim() ? rawSlug.trim() : titleToSlug(title)

    const featured = readCheckbox('Featured', block, recordMap)
    const description = getPageProperty<string>('Description', block, recordMap) ?? null
    const url = getPageProperty<string>('URL', block, recordMap) ?? null
    const rawTags = getPageProperty<unknown>('Tags', block, recordMap)
    const tags = Array.isArray(rawTags)
      ? (rawTags as string[]).map((t) => t.trim()).filter(Boolean)
      : typeof rawTags === 'string' && rawTags
        ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
        : []
    const blockNodashId = uuidToId(block.id)
    const rawCover = block.format?.page_cover ?? null
    // notion.getPage() pre-resolves attachment:// covers into signed S3 URLs via
    // getSignedFileUrls and stores them in recordMap.signed_urls keyed by no-dash block ID.
    const cover =
      typeof rawCover === 'string'
        ? (recordMap.signed_urls?.[blockNodashId] ?? rawCover)
        : null

    const published = tsToDateStr(getPageProperty<number>('Published', block, recordMap)) ?? ''
    const start = tsToDateStr(getPageProperty<number>('Start', block, recordMap))
    const end = tsToDateStr(getPageProperty<number>('End', block, recordMap))

    projects.push({
      id: blockNodashId,
      slug,
      title,
      description,
      public: true,
      featured,
      published,
      url,
      tags,
      cover: typeof cover === 'string' ? cover : null,
      start,
      end,
    })
  }

  // Featured projects first, then newest by published date
  return projects.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (!a.published && !b.published) return 0
    if (!a.published) return 1
    if (!b.published) return -1
    return b.published.localeCompare(a.published)
  })
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}

function tsToDateStr(ts: number | null | undefined): string | null {
  if (!ts) return null
  return new Date(ts).toISOString().slice(0, 10)
}

// Notion checkbox properties arrive as 'Yes' / '' (string) or true / false (boolean)
// depending on the API version — handle both forms.
function readCheckbox(name: string, block: Block, recordMap: ExtendedRecordMap): boolean {
  const v = getPageProperty<unknown>(name, block, recordMap)
  return v === true || v === 'Yes'
}

// Reads a Notion date-range property and returns the raw "YYYY-MM-DD" start/end strings.
// getPageProperty() loses the end_date when formatting, so we walk the raw DecorationSet.
function getDateRangeProperty(
  propertyName: string,
  block: Block,
  recordMap: ExtendedRecordMap
): { start: string | null; end: string | null } {
  if (!block.properties) return { start: null, end: null }

  const collectionValues = Object.values(recordMap.collection ?? {})
  const collBox = collectionValues[0]
  if (!collBox) return { start: null, end: null }

  // Unwrap the collection box (same nested pattern as blocks)
  const coll = 'schema' in (collBox.value ?? {})
    ? collBox.value
    : (collBox as unknown as { value: { schema: CollectionPropertySchemaMap } }).value

  const propId = Object.entries((coll as { schema?: CollectionPropertySchemaMap }).schema ?? {}).find(
    ([, s]) => s.name === propertyName
  )?.[0]
  if (!propId) return { start: null, end: null }

  const rawProp = (block.properties as Record<string, unknown>)[propId]
  if (!Array.isArray(rawProp)) return { start: null, end: null }

  // DecorationSet shape: [["‣" | " ", [["d", FormattedDate], ...]]]
  for (const chunk of rawProp as unknown[][]) {
    const decorations = chunk[1]
    if (!Array.isArray(decorations)) continue
    for (const dec of decorations as unknown[][]) {
      if (dec[0] !== 'd') continue
      const fd = dec[1] as FormattedDate
      return { start: fd.start_date ?? null, end: fd.end_date ?? null }
    }
  }

  return { start: null, end: null }
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
