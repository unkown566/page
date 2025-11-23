'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  BarChart3,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Archive,
  Bell,
  Shield,
  FileText,
} from 'lucide-react'

interface SidebarProps {
  capturesCount?: number
  activeLinksCount?: number
}

export default function Sidebar({ capturesCount = 0, activeLinksCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/mamacita') {
      return pathname === '/mamacita'
    }
    return pathname?.startsWith(path)
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/mamacita',
      icon: LayoutDashboard,
    },
    {
      label: 'Links',
      href: '/mamacita/links',
      icon: LinkIcon,
      badge: activeLinksCount > 0 ? activeLinksCount : undefined,
    },
    {
      label: 'Captures',
      href: '/mamacita/captures',
      icon: Mail,
      badge: capturesCount > 0 ? capturesCount : undefined,
    },
    {
      label: 'Analytics',
      href: '/mamacita/analytics',
      icon: BarChart3,
    },
    {
      label: 'Templates',
      href: '/mamacita/templates',
      icon: FileText,
    },
    {
      label: 'Settings',
      href: '/mamacita/settings',
      icon: Settings,
    },
    {
      label: 'Account',
      href: '/mamacita/account',
      icon: User,
    },
  ]

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen glass glass-dark border-r-0
        transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦊</span>
            <span className="font-bold text-gray-900 dark:text-white">FOX Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

