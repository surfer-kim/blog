'use client'

import dynamic from 'next/dynamic'
import NextImage from 'next/image'
import type { ComponentProps } from 'react'
import type { ExtendedRecordMap, PreviewImageMap } from 'notion-types'
import { NotionRenderer } from 'react-notion-x'

import { mapNotionImageUrl, mapPageUrl } from '@/lib/map-page-url'

// react-notion-x's wrapNextImage checks `fill === "undefined"` (the string) instead of
// `fill === undefined`, so images without explicit dimensions arrive here with no fill and
// no width/height — which next/image rejects.
//
// Additionally, mapNotionImageUrl rewrites Notion URLs to our local proxy
// (/api/notion/image?url=...) before they reach here. next/image would then try to
// optimise a local URL, requiring localPatterns — i.e. double-proxying. Instead we
// unwrap the original Notion URL so next/image fetches it directly via remotePatterns.
function NotionNextImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  style,
  ...rest
}: ComponentProps<typeof NextImage>) {
  // Unwrap proxy URL → original Notion URL so next/image uses remotePatterns directly.
  // Skip unwrapping for attachment:// URLs — next/image cannot handle that protocol,
  // so they must stay proxied (localPatterns covers /api/notion/image).
  const resolvedSrc = (() => {
    if (typeof src !== 'string' || !src.startsWith('/api/notion/image?')) return src
    const decoded = new URLSearchParams(src.slice(src.indexOf('?') + 1)).get('url') ?? src
    return decoded.startsWith('http://') || decoded.startsWith('https://') ? decoded : src
  })()

  const hasDimensions = width != null && height != null
  const useFill = fill != null ? fill : !hasDimensions

  if (!useFill && hasDimensions) {
    return (
      <NextImage
        src={resolvedSrc}
        alt={alt ?? ''}
        width={width}
        height={height}
        className={className}
        style={style}
        {...rest}
      />
    )
  }

  // Dimensions unknown — use the 0/0 + sizes pattern so next/image can still
  // optimise without an explicit container height.
  return (
    <NextImage
      src={resolvedSrc}
      alt={alt ?? ''}
      width={0}
      height={0}
      sizes="100vw"
      className={className}
      style={{ width: '100%', height: 'auto', ...style }}
      {...rest}
    />
  )
}

// Heavy sub-renderers are lazy-loaded so they don't bloat the initial bundle.
// Each is only downloaded when the page actually contains that block type.
const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
)
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)
const Pdf = dynamic(() =>
  import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf), { ssr: false }
)
const Modal = dynamic(() =>
  import('react-notion-x/build/third-party/modal').then((m) => m.Modal), { ssr: false }
)

type Props = {
  recordMap: ExtendedRecordMap
  rootPageId: string
  previewImages?: PreviewImageMap
}

export default function NotionPage({ recordMap, rootPageId, previewImages }: Props) {
  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage
      darkMode={false}
      rootPageId={rootPageId}
      mapPageUrl={mapPageUrl(recordMap)}
      mapImageUrl={mapNotionImageUrl}
      previewImages={!!previewImages}
      forceCustomImages
      components={{
        nextImage: NotionNextImage,
        Code,
        Collection,
        Equation,
        Pdf,
        Modal,
      }}
    />
  )
}
