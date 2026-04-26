import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import NotionPage from '@/components/NotionPage'
import { getAllPages, getPage } from '@/lib/notion'
import { getPreviewImages } from '@/lib/preview-images'
import siteConfig from '@/site.config'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

// Pre-build all known slugs at build time
export async function generateStaticParams() {
  if (!siteConfig.rootNotionPageId) return []
  const pages = await getAllPages()
  return pages.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!siteConfig.rootNotionPageId) return {}

  const pages = await getAllPages()
  const page = pages.find((p) => p.slug === slug)
  if (!page) return {}

  const baseUrl = `https://${siteConfig.domain}`
  const pageUrl = `${baseUrl}/${page.slug}`
  const ogImage = page.cover
    ? `${baseUrl}/api/notion/image?url=${encodeURIComponent(page.cover)}&blockId=${page.id}`
    : undefined

  return {
    title: `${page.title} — ${siteConfig.name}`,
    description: page.description ?? undefined,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: page.title,
      description: page.description ?? undefined,
      url: pageUrl,
      type: 'article',
      ...(page.date ? { publishedTime: page.date } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: page.title,
      description: page.description ?? undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  if (!siteConfig.rootNotionPageId) notFound()

  const pages = await getAllPages()
  const page = pages.find((p) => p.slug === slug)
  if (!page) notFound()

  const recordMap = await getPage(page.id)
  // Preview images are best-effort; a failure won't break the page
  const previewImages = await getPreviewImages(recordMap).catch(() => undefined)

  return (
    <NotionPage
      recordMap={recordMap}
      rootPageId={page.id}
      {...(previewImages ? { previewImages } : {})}
    />
  )
}
