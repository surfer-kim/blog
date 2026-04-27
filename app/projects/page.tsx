import { getAllProjects } from '@/lib/notion'
import siteConfig from '@/site.config'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 60

export const metadata: Metadata = {
  title: `Projects — ${siteConfig.name}`,
  description: 'Things I have built.',
}

function fmtDate(d: string): string {
  // Input is "YYYY-MM-DD"; parse as UTC to avoid timezone shifts
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start) return null
  return end ? `${fmtDate(start)} – ${fmtDate(end)}` : `${fmtDate(start)} – Present`
}

function formatPublished(published: string): string | null {
  if (!published) return null
  return fmtDate(published)
}

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]

function tagColor(tag: string): string {
  const hash = [...tag].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]!
}

function coverSrc(cover: string, blockId: string): string {
  // Signed S3 URLs and external HTTPS covers can be used directly by next/image.
  // attachment:// and other URLs go through the proxy which resolves them server-side.
  if (cover.startsWith('https://') || cover.startsWith('http://')) return cover
  return `/api/notion/image?url=${encodeURIComponent(cover)}&blockId=${blockId}`
}

export default async function ProjectsPage() {
  const projects = await getAllProjects()

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-10">Projects</h1>
      {projects.length === 0 ? (
        <p className="text-zinc-400 text-sm">No projects yet.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((project, i) => {
            const period = formatPeriod(project.start, project.end)
            return (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="flex flex-col rounded-xl border border-zinc-100 overflow-hidden hover:border-zinc-300 transition-colors h-full"
                >
                  {/* Cover */}
                  <div className="relative w-full aspect-video bg-zinc-50">
                    {project.cover ? (
                      <Image
                        src={coverSrc(project.cover, project.id)}
                        alt={project.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 50vw, 100vw"
                        priority={i < 2}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-100" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2 p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-base font-medium text-zinc-900 leading-snug">
                        {project.title}
                      </span>
                      <div className="flex gap-3 shrink-0">
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                          >
                            Live ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {period && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500">{period}</span>
                        </div>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-sm text-zinc-500 line-clamp-3 mt-1">{project.description}</p>
                    )}

                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-xs px-2 py-0.5 rounded-full ${tagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
