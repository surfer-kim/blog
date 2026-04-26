import { getAllPages } from '@/lib/notion'
import siteConfig from '@/site.config'
import PostList from '@/components/PostList'

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
        <PostList pages={pages} />
      )}
    </main>
  )
}
