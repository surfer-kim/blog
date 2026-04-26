import { getAllPages } from '@/lib/notion'
import siteConfig from '@/site.config'
import Link from 'next/link'

export const revalidate = 60

export default async function HomePage() {
  if (!siteConfig.rootNotionPageId) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20">
        <p className="text-zinc-500 text-sm">
          Set <code className="font-mono bg-zinc-100 px-1 rounded">rootNotionPageId</code> in{' '}
          <code className="font-mono bg-zinc-100 px-1 rounded">site.config.ts</code> to get started.
        </p>
      </main>
    )
  }

  const pages = await getAllPages()

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {pages.length === 0 ? (
        <p className="text-zinc-400 text-sm">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {pages.map((page) => (
            <li key={page.id} className="py-6">
              <Link href={`/${page.slug}`} className="group flex flex-col gap-1">
                <span className="text-base font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                  {page.title}
                </span>
                {page.description && (
                  <span className="text-sm text-zinc-500 line-clamp-2">{page.description}</span>
                )}
                {page.date && (
                  <time dateTime={page.date} className="text-xs text-zinc-400 mt-1">
                    {new Date(page.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
