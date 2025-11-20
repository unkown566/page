'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { authenticateMember } from '@/lib/utils/memberUtils'
import Link from 'next/link'

interface AccessFormProps {
  memberId: string
}

export default function AccessForm({ memberId }: AccessFormProps) {
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authenticateMember({
        memberId,
        password,
        verificationCode: requiresVerification ? verificationCode : undefined
      })

      if (result.requiresVerification && !requiresVerification) {
        setRequiresVerification(true)
        setLoading(false)
        return
      }

      window.location.href = '/mamacita'
    } catch (err: any) {
      setError(err.message || 'Access denied')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email/Member ID Label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm text-gray-400 mb-2">
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={memberId}
            readOnly
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white font-mono text-sm cursor-not-allowed focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm text-gray-400 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-12 pr-12 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white focus:border-blue-500 focus:outline-none transition-all"
            placeholder="Enter your password"
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

      {/* 2FA/Verification Code */}
      {requiresVerification && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <label className="block text-sm text-gray-400 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="w-full px-4 py-4 rounded-xl bg-[#1e2537] border border-gray-700 text-white text-center text-2xl font-mono tracking-widest focus:border-blue-500 focus:outline-none"
            placeholder="000000"
          />
        </motion.div>
      )}

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

      {/* Forgot Password */}
      <div className="flex items-center justify-end">
        <Link
          href="/portal/recover"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-4 px-4 rounded-xl font-medium text-white bg-[#0066ff] hover:bg-[#0052cc] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? 'Connecting...' : 'Sign in'}
      </motion.button>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-400 pt-4">
        Already a member?{' '}
        <Link
          href="/portal/register"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  )
}

