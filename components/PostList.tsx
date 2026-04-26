'use client'

import type { PageMeta } from '@/lib/notion'
import Link from 'next/link'
import { useState } from 'react'

const PAGE_SIZE = 5

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

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default function PostList({ pages }: { pages: PageMeta[] }) {
  const [count, setCount] = useState(PAGE_SIZE)
  const visible = pages.slice(0, count)
  const hasMore = count < pages.length

  return (
    <>
      <ul className="divide-y divide-zinc-100">
        {visible.map((page) => (
          <li key={page.id} className="py-6">
            <Link href={`/${page.slug}`} className="group flex flex-col gap-2">
              <span className="text-base font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                {page.title}
              </span>

              {page.description && (
                <span className="text-sm text-zinc-500 line-clamp-2">{page.description}</span>
              )}

              <div className="flex items-center gap-3 flex-wrap mt-0.5">
                {page.published && (
                  <time dateTime={page.published} className="text-xs text-zinc-400 shrink-0">
                    {fmtDate(page.published)}
                  </time>
                )}
                {page.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {page.tags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setCount((c) => c + PAGE_SIZE)}
            className="text-sm text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 rounded-lg px-5 py-2 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}
