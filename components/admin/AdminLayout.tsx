'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AdminLayoutProps {
  children: React.ReactNode
  capturesCount?: number
  activeLinksCount?: number
}

export default function AdminLayout({
  children,
  capturesCount = 0,
  activeLinksCount = 0,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        capturesCount={capturesCount}
        activeLinksCount={activeLinksCount}
      />
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <TopBar sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto pt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}




