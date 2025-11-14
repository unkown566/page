'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Key, Eye, EyeOff, CheckCircle, Ticket } from 'lucide-react'
import { signupUser } from '@/lib/auth/foxAuth'
import { generateFoxId } from '@/lib/auth/foxIdGenerator'
import Link from 'next/link'

export default function SignupForm() {
  const [foxId] = useState(generateFoxId())
  const [licenseToken, setLicenseToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    const labels = ['Weak', 'Fair', 'Good', 'Strong']
    const colors = ['red', 'orange', 'yellow', 'green']
    return { score, label: labels[score - 1] || '', color: colors[score - 1] || 'gray' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await signupUser({
        licenseToken,
        password,
        confirmPassword
      }, foxId)

      // Success - redirect to login
      window.location.href = '/auth/login'
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = passwordStrength()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-generated Fox ID */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Fox Member ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Key className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={foxId}
            readOnly
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-gray-900 dark:text-white font-mono text-sm cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This is your unique member ID - save it securely!
        </p>
      </motion.div>

      {/* License Token */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          License Token
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Ticket className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={licenseToken}
            onChange={(e) => setLicenseToken(e.target.value)}
            required
            className="w-full pl-12 px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
            placeholder="Enter your license token"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter the token you received with your purchase
        </p>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
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
            minLength={8}
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
            placeholder="Create a strong password"
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

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Strength:</span>
              <span className={`font-medium ${
                strength.color === 'green' ? 'text-green-600' :
                strength.color === 'yellow' ? 'text-yellow-600' :
                strength.color === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(strength.score / 4) * 100}%` }}
                className={`h-full ${
                  strength.color === 'green' ? 'bg-green-500' :
                  strength.color === 'yellow' ? 'bg-yellow-500' :
                  strength.color === 'orange' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Confirm Password */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            )}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Passwords do not match
          </p>
        )}
      </motion.div>

      {/* Terms & Conditions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-start gap-3"
      >
        <input
          type="checkbox"
          id="terms"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
          I agree to the{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </label>
      </motion.div>

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

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading || !acceptTerms}
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
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </motion.button>

      {/* Login Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Sign In
        </Link>
      </div>
    </form>
  )
}

