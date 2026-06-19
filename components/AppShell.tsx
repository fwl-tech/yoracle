'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'

interface AppShellProps {
  active?: 'digest' | 'dashboards' | 'chat' | 'connectors' | 'settings' | 'admin'
  showAdmin?: boolean
  hideMobileNav?: boolean
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/digest', label: 'Digest', key: 'digest' as const, icon: DigestIcon },
  { href: '/dashboards', label: 'Dashboards', key: 'dashboards' as const, icon: ChartIcon },
  { href: '/chat', label: 'Ask AI', key: 'chat' as const, icon: ChatIcon },
  { href: '/connectors', label: 'Connectors', key: 'connectors' as const, icon: LinkIcon },
  { href: '/settings', label: 'Settings', key: 'settings' as const, icon: SettingsIcon },
]

function DigestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7 3h4v11h-4V10z" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.2-3.6A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  compact,
}: {
  href: string
  label: string
  icon: typeof DigestIcon
  active: boolean
  onClick?: () => void
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={active ? 'nav-item-active' : 'nav-item-inactive'}
      title={compact ? label : undefined}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      {!compact && <span>{label}</span>}
    </Link>
  )
}

export default function AppShell({ active, showAdmin, hideMobileNav, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const allItems = [
    ...NAV_ITEMS,
    ...(showAdmin ? [{ href: '/admin', label: 'Admin', key: 'admin' as const, icon: AdminIcon }] : []),
  ]

  const mobileTabs = NAV_ITEMS.filter(i => i.key !== 'settings')

  return (
    <div className="flex h-dvh bg-surface-base overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-col shrink-0 bg-surface-sidebar border-r border-ink-faint/50 shadow-sidebar">
        <div className="px-5 h-16 flex items-center border-b border-ink-faint/40">
          <Link href="/digest" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-surface-raised text-sm font-heading font-semibold">
              Y
            </div>
            <span className="font-heading text-lg font-medium text-ink tracking-tight">Yoracle</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {allItems.map(item => (
            <NavLink
              key={item.key}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active === item.key}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-ink-faint/40">
          <p className="text-[11px] text-ink-muted leading-relaxed">
            AI-powered business intelligence for your team.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-ink-faint/50 pt-safe-top">
          <div className="px-4 h-14 flex items-center justify-between">
            <Link href="/digest" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-surface-raised text-xs font-heading font-semibold">
                Y
              </div>
              <span className="font-heading text-base font-medium text-ink">Yoracle</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="btn-ghost rounded-xl p-2"
              aria-label="Open menu"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        {!hideMobileNav && (
          <nav
            className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ink-faint/60 bg-surface-raised/95 backdrop-blur-md pb-safe"
            aria-label="Main navigation"
          >
            <div className="grid grid-cols-5 h-16">
              {mobileTabs.map(tab => {
                const Icon = tab.icon
                const isActive = active === tab.key
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={`flex flex-col items-center justify-center gap-0.5 min-h-11 transition ${
                      isActive ? 'text-ink' : 'text-ink-muted'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-accent-500' : ''}`} />
                    <span className={`text-[10px] leading-tight ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
                  </Link>
                )
              })}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-11 transition ${
                  active === 'settings' || active === 'admin' ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                <SettingsIcon className={`w-5 h-5 ${active === 'settings' || active === 'admin' ? 'text-accent-500' : ''}`} />
                <span className="text-[10px] leading-tight">More</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface-raised border-l border-ink-faint shadow-2xl flex flex-col pb-safe">
            <div className="flex items-center justify-between px-5 h-14 border-b border-ink-faint/50">
              <span className="font-medium text-ink">Menu</span>
              <button type="button" onClick={() => setMenuOpen(false)} className="btn-ghost rounded-xl" aria-label="Close">
                ✕
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {allItems.map(item => (
                <NavLink
                  key={item.key}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={active === item.key}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
