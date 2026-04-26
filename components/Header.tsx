import siteConfig from '@/site.config'
import Link from 'next/link'

export default function Header() {
  const { name, social } = siteConfig

  return (
    <header className="border-b border-zinc-100">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-900 hover:text-blue-600 transition-colors"
        >
          {name}.
        </Link>
      </div>
    </header>
  )
}