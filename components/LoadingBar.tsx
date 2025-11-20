'use client'

interface LoadingBarProps {
  progress?: number // 0-100
  message?: string
}

export default function LoadingBar({ progress = 0, message }: LoadingBarProps) {
  return (
    <div className="w-full">
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
          }}
        >
          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
        </div>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          {message}
        </p>
      )}
    </div>
  )
}











