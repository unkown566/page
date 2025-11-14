'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Key, Eye, EyeOff } from 'lucide-react'
import { loginUser } from '@/lib/auth/foxAuth'
import Link from 'next/link'

interface LoginFormProps {
  foxId: string // Pre-filled, not editable
}

export default function LoginForm({ foxId }: LoginFormProps) {
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginUser({
        foxId,
        password,
        twoFactorCode: requiresTwoFactor ? twoFactorCode : undefined
      })

      if (result.requiresTwoFactor && !requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setLoading(false)
        return
      }

      // Login successful
      window.location.href = '/admin' // Redirect to dashboard
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fox ID (Non-editable) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fox Member ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Key className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={foxId}
            readOnly
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-sm cursor-not-allowed"
          />
        </div>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            )}
          </button>
        </div>
      </motion.div>

      {/* 2FA Code (Conditional) */}
      {requiresTwoFactor && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Two-Factor Authentication Code
          </label>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
          />
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Forgot Password */}
      <div className="flex items-center justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </motion.button>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Create Account
        </Link>
      </div>
    </form>
  )
}

