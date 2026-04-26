import siteConfig from '@/site.config'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Surfing — ${siteConfig.name}`,
  description: 'Surfing shorts from around the world.',
}

type VideoItem = {
  id: { videoId: string }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: { medium: { url: string } }
  }
}

type YouTubeShort = {
  videoId: string
  title: string
  channelTitle: string
}

async function getChannelIdByHandle(handle: string, apiKey: string): Promise<string | null> {
  // Remove '@' if included
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle

  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'id')
  url.searchParams.set('forHandle', cleanHandle) // Built-in support for handles
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString())
    const data = await res.json()
    return data.items?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function getSurfingShorts(): Promise<YouTubeShort[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  const channelId = await getChannelIdByHandle(siteConfig.social?.youtube!, apiKey)
  if (!channelId) return []

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('channelId', channelId)
  url.searchParams.set('order', 'date')
  url.searchParams.set('type', 'video')
  url.searchParams.set('videoDuration', 'short')
  url.searchParams.set('maxResults', '9')
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data: { items?: VideoItem[] } = await res.json()
    return (data.items ?? []).map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
    }))
  } catch {
    return []
  }
}

export default async function SurfingPage() {
  const shorts = await getSurfingShorts()

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">Your favorite kook</h1>

      {shorts.length === 0 ? (
        <p className="text-zinc-400 text-sm">
          No videos found. Check your{' '}
          <code className="font-mono bg-zinc-100 px-1 rounded text-xs">YOUTUBE_API_KEY</code>{' '}
          or ensure the Channel ID is correct.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shorts.map((short) => (
            <div key={short.videoId} className="flex flex-col">
              <div
                className="relative w-full rounded-xl overflow-hidden bg-zinc-100"
                style={{ paddingBottom: '177.78%' }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${short.videoId}`}
                  title={short.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <p className="text-sm font-medium text-zinc-800 mt-3 line-clamp-2">{short.title}</p>
              <p className="text-xs text-zinc-400 mt-1">{short.channelTitle}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}