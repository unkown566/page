'use client'

import { Globe } from 'lucide-react'

type Language = 'auto' | 'en' | 'ja' | 'ko' | 'de' | 'es'

const languages = [
  { value: 'auto', label: 'Auto-detect (Based on visitor location)', flag: '🌐' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ja', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean (한국어)', flag: '🇰🇷' },
  { value: 'de', label: 'German (Deutsch)', flag: '🇩🇪' },
  { value: 'es', label: 'Spanish (Español)', flag: '🇪🇸' },
]

interface LanguageSettingsProps {
  currentLanguage: Language
  onChange: (language: Language) => void
}

export default function LanguageSettings({ currentLanguage, onChange }: LanguageSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Loading Page Language
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Choose the language for loading page templates. Auto-detect will use the visitor&apos;s location (IP-based).
      </p>

      <div className="space-y-2">
        {languages.map((lang) => (
          <label
            key={lang.value}
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
              currentLanguage === lang.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <input
              type="radio"
              name="language"
              value={lang.value}
              checked={currentLanguage === lang.value}
              onChange={(e) => onChange(e.target.value as Language)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-sm text-gray-900 dark:text-white font-medium">
              {lang.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> All translations are stored server-side for security. 
          Visitors will see templates in their detected/configured language.
        </p>
      </div>
    </div>
  )
}






