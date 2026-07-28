import Link from 'next/link'
import { Logo } from './Logo'

const LINKS = [
  { href: '/', label: 'Visão geral' },
  { href: '/midia-paga', label: 'Mídia paga' },
  { href: '/organico', label: 'Orgânico' },
]

export function Nav() {
  return (
    <nav className="border-b border-alltech-blue/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Logo />
        <div className="flex gap-6 text-sm font-medium text-alltech-blue/70">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-alltech-blue">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
