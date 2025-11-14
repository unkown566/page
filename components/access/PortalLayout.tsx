'use client'

import { useTheme } from '@/lib/theme/ThemeProvider'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

interface PortalLayoutProps {
  children: React.ReactNode
  leftContent?: React.ReactNode
  title?: string
  subtitle?: string
  leftImage?: string // Custom 3D scene
}

export default function PortalLayout({ 
  children, 
  leftContent,
  title,
  subtitle,
  leftImage 
}: PortalLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen w-full bg-[#0a0e27] relative">
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-all"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </motion.button>

      {/* Main Container */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 min-h-[700px] bg-[#0f1629] rounded-2xl overflow-hidden shadow-2xl">
            {/* Left Side - 3D Scene */}
            <div className="relative hidden md:flex flex-col items-center justify-center p-12 bg-[#0a0e27]">
              {/* 3D Isometric Scene */}
              <div className="absolute inset-0 flex items-center justify-center">
                {leftContent || leftImage ? (
                  leftContent
                ) : (
                  <div className="text-center space-y-8">
                    {/* Tech Icon/Logo */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, type: "spring" }}
                      className="text-8xl"
                    >
                      🏙️
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      <h1 className="text-4xl font-bold text-white">
                        AI Generative
                      </h1>
                      <h2 className="text-3xl font-light text-blue-300">
                        Anything you can Imagine
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Generate anytype of art with Openartistic
                      </p>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-5" 
                style={{
                  backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}
              />
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-b from-[#1a1f3a] to-[#0f1629]">
              <div className="w-full max-w-md">
                {title && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <p className="text-sm text-gray-400 mb-2">{subtitle || 'Login your account'}</p>
                    <h2 className="text-4xl font-bold text-white">
                      {title}
                    </h2>
                    {subtitle && subtitle !== 'Login your account' && (
                      <p className="text-gray-400 mt-2">{subtitle}</p>
                    )}
                  </motion.div>
                )}

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

