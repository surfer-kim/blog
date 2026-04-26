import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import NotionPage from '@/components/NotionPage'
import { getAllProjects, getPage } from '@/lib/notion'
import { getPreviewImages } from '@/lib/preview-images'
import siteConfig from '@/site.config'

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (!siteConfig.projectsNotionPageId) return []
  const projects = await getAllProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!siteConfig.projectsNotionPageId) return {}

  const projects = await getAllProjects()
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}

  const baseUrl = siteConfig.domain
  const pageUrl = `${baseUrl}/projects/${project.slug}`
  const ogImage = project.cover?.startsWith('https://')
    ? project.cover
    : project.cover
      ? `${baseUrl}/api/notion/image?url=${encodeURIComponent(project.cover)}&blockId=${project.id}`
      : undefined

  return {
    title: `${project.title} — ${siteConfig.name}`,
    description: project.description ?? undefined,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: project.title,
      description: project.description ?? undefined,
      url: pageUrl,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: project.title,
      description: project.description ?? undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params

  if (!siteConfig.projectsNotionPageId) notFound()

  const projects = await getAllProjects()
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  const recordMap = await getPage(project.id)
  const previewImages = await getPreviewImages(recordMap).catch(() => undefined)

  return (
    <NotionPage
      recordMap={recordMap}
      rootPageId={project.id}
      {...(previewImages ? { previewImages } : {})}
    />
  )
}
