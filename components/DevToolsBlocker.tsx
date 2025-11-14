'use client'

import { useEffect } from 'react'

/**
 * DevToolsBlocker - Prevents users from opening developer tools
 * Blocks: F12, Right-click, Inspect, View Source, and detects DevTools
 */
export default function DevToolsBlocker() {
  useEffect(() => {
    // Clear console on mount
    if (typeof window !== 'undefined') {
      try {
        console.clear()
      } catch (e) {}
    }

    // 1. Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Developer Tools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+I / Cmd+Option+I - Inspector
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.metaKey && e.altKey && e.key === 'I')) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+J / Cmd+Option+J - Console
      if ((e.ctrlKey && e.shiftKey && e.key === 'J') || 
          (e.metaKey && e.altKey && e.key === 'J')) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+C / Cmd+Option+C - Inspect Element
      if ((e.ctrlKey && e.shiftKey && e.key === 'C') || 
          (e.metaKey && e.altKey && e.key === 'C')) {
        e.preventDefault()
        return false
      }

      // Ctrl+U / Cmd+U - View Source
      if ((e.ctrlKey && e.key === 'u') || (e.metaKey && e.key === 'u')) {
        e.preventDefault()
        return false
      }

      // Ctrl+S / Cmd+S - Save Page
      if ((e.ctrlKey && e.key === 's') || (e.metaKey && e.key === 's')) {
        e.preventDefault()
        return false
      }

      // Ctrl+Shift+K - Firefox Web Console
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        return false
      }
    }

    // 2. Block right-click (context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // 3. Detect DevTools by checking if console is open
    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold
      
      if (widthThreshold || heightThreshold) {
        // DevTools detected - redirect or take action
        if (typeof window !== 'undefined') {
          try {
            console.clear()
            // Optionally redirect
            // window.location.href = 'https://www.google.com'
          } catch (e) {}
        }
      }
    }

    // 4. Advanced DevTools detection using debugger timing
    const detectDevToolsByTiming = () => {
      const start = performance.now()
      // This will pause if DevTools is open
      // eslint-disable-next-line no-debugger
      debugger
      const end = performance.now()
      
      // If time difference is significant, DevTools is likely open
      if (end - start > 100) {
        if (typeof window !== 'undefined') {
          try {
            console.clear()
            // Optionally redirect
            // window.location.href = 'https://www.google.com'
          } catch (e) {}
        }
      }
    }

    // 5. Disable text selection
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // 6. Disable drag
    const handleDragStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // 7. Console override - make console methods do nothing
    const disableConsole = () => {
      if (typeof window !== 'undefined') {
        try {
          // Save original console
          const noop = () => {}
          
          // Override console methods
          if (typeof console !== 'undefined') {
            console.log = noop
            console.debug = noop
            console.info = noop
            console.warn = noop
            console.error = noop
            console.table = noop
            console.clear = noop
            console.trace = noop
            console.dir = noop
            console.dirxml = noop
            console.group = noop
            console.groupCollapsed = noop
            console.groupEnd = noop
            console.count = noop
            console.assert = noop
            console.profile = noop
            console.profileEnd = noop
            console.time = noop
            console.timeEnd = noop
            console.timeStamp = noop
          }
        } catch (e) {}
      }
    }

    // 8. Clear console periodically
    const consoleClearInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        try {
          console.clear()
        } catch (e) {}
      }
    }, 1000)

    // 9. DevTools detection interval
    const devToolsInterval = setInterval(() => {
      detectDevTools()
    }, 1000)

    // 10. Timing-based detection interval (less frequent to avoid performance impact)
    const timingInterval = setInterval(() => {
      detectDevToolsByTiming()
    }, 5000)

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    // Disable console methods
    disableConsole()

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      clearInterval(consoleClearInterval)
      clearInterval(devToolsInterval)
      clearInterval(timingInterval)
    }
  }, [])

  // This component doesn't render anything
  return null
}

