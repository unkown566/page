'use client'

import { useTheme } from '@/lib/theme/ThemeProvider'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
  leftContent?: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({ 
  children, 
  leftContent,
  title,
  subtitle 
}: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-full backdrop-blur-lg bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 shadow-xl hover:scale-110 transition-transform"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-700" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-300" />
        )}
      </motion.button>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Container */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl"
        >
          {/* Glass Morphism Container */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10">
            <div className="grid md:grid-cols-2 min-h-[600px]">
              {/* Left Side - Image/Content */}
              <div className="relative hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800">
                <div className="absolute inset-0 bg-black/20" />
                
                <div className="relative z-10 text-white text-center">
                  {leftContent || (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-8"
                      >
                        <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center text-6xl font-bold">
                          🦊
                        </div>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-bold mb-4"
                      >
                        Fox Authentication
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg opacity-90"
                      >
                        Secure • Professional • Modern
                      </motion.p>
                    </>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Right Side - Form */}
              <div className="flex flex-col items-center justify-center p-8 md:p-12">
                <div className="w-full max-w-md">
                  {title && (
                    <motion.h2
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    >
                      {title}
                    </motion.h2>
                  )}

                  {subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-gray-600 dark:text-gray-400 mb-8"
                    >
                      {subtitle}
                    </motion.p>
                  )}

                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* Fox Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400"
          >
            Powered by Fox Authentication System © {new Date().getFullYear()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}







