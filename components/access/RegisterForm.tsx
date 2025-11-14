'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, CheckCircle, Ticket } from 'lucide-react'
import { registerMember } from '@/lib/utils/memberUtils'
import { generateMemberId } from '@/lib/utils/idGenerator'
import Link from 'next/link'

export default function RegisterForm() {
  const [memberId] = useState(generateMemberId())
  const [email, setEmail] = useState('')
  const [serviceCode, setServiceCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('Please accept the terms of service')
      return
    }

    setLoading(true)

    try {
      await registerMember({
        serviceCode,
        password,
        confirmPassword: password
      }, memberId)

      window.location.href = '/portal/access'
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm text-gray-400 mb-2">
          E-mail
        </label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            placeholder="your.email@example.com"
          />
        </div>
      </motion.div>

      {/* Service Code (Hidden as email-like field for obfuscation) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm text-gray-400 mb-2">
          Access Code
        </label>
        <input
          type="text"
          value={serviceCode}
          onChange={(e) => setServiceCode(e.target.value)}
          required
          className="w-full px-4 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-all"
          placeholder="Enter your access code"
        />
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label className="block text-sm text-gray-400 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            placeholder="••••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500 hover:text-gray-300" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3"
      >
        <input
          type="checkbox"
          id="terms"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="w-4 h-4 rounded bg-[#1e2537] border-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
        />
        <label htmlFor="terms" className="text-sm text-gray-400">
          I agree to the terms of service
        </label>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-4 px-4 rounded-xl font-medium text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </motion.button>

      {/* Login Link */}
      <div className="text-center text-sm text-gray-400 pt-4">
        Already a member?{' '}
        <Link
          href="/portal/access"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Sign in
        </Link>
      </div>

      {/* Hidden Member ID Storage */}
      <input type="hidden" value={memberId} />
    </form>
  )
}

