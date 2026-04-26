import siteConfig from '@/site.config'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Blog', href: '/' },
  { label: 'Projects', href: '/projects' },
]

export default function Header() {
  const { name } = siteConfig

  return (
    <header className="border-b border-zinc-100">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-900 hover:text-blue-600 transition-colors"
        >
          {name}.
        </Link>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}