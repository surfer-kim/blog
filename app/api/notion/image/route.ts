import { type NextRequest, NextResponse } from 'next/server'
import { idToUuid } from 'notion-utils'
import { notion } from '@/lib/notion'

// Proxies Notion-hosted images to avoid CORS issues and expired S3 signed URLs.
// react-notion-x calls mapNotionImageUrl() which rewrites image src to this route.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get('url')
  const blockId = req.nextUrl.searchParams.get('blockId') ?? ''

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 })
  }

  // Notion stores uploaded files as "attachment:<uuid>:<filename>" — not a real URL.
  // Resolve to a signed S3 URL before fetching.
  // Notion's API requires UUID format (with dashes); callers may pass no-dash IDs.
  // idToUuid corrupts IDs that already contain dashes, so only convert when needed.
  let resolvedUrl = url
  if (url.startsWith('attachment:')) {
    const normalizedBlockId = blockId.includes('-') ? blockId : idToUuid(blockId)
    const result = await notion.getSignedFileUrls([
      { url, permissionRecord: { table: 'block', id: normalizedBlockId } },
    ])
    const signed = result.signedUrls[0]
    if (!signed) return new NextResponse('Could not resolve attachment URL', { status: 404 })
    resolvedUrl = signed
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(resolvedUrl)
  } catch {
    return new NextResponse('Invalid url param', { status: 400 })
  }

  // Only proxy known Notion / S3 hosts to prevent open-redirect abuse
  const allowedHosts = [
    'www.notion.so',
    'notion.so',
    'images.unsplash.com',
    's3.us-west-2.amazonaws.com',
    's3-us-west-2.amazonaws.com',
    'secure.notion-static.com',
    'prod-files-secure.s3.us-west-2.amazonaws.com',
  ]

  if (!allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`))) {
    return new NextResponse('Disallowed host', { status: 403 })
  }

  const upstream = await fetch(resolvedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  const cacheControl = upstream.headers.get('cache-control') ?? 'public, max-age=31536000, immutable'

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  })
}
