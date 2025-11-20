'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { parseEmailList } from '@/lib/emailListParser'

interface EmailListUploaderProps {
  onEmailsParsed: (emails: string[]) => void
  onError?: (error: string) => void
  maxSize?: number // Max file size in MB
}

export default function EmailListUploader({
  onEmailsParsed,
  onError,
  maxSize = 10, // Default 10MB
}: EmailListUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (selectedFile: File) => {
    // Validate file type
    const extension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (extension !== 'csv' && extension !== 'txt') {
      const err = 'Please upload a .csv or .txt file'
      setError(err)
      onError?.(err)
      return
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      const err = `File size exceeds ${maxSize}MB limit`
      setError(err)
      onError?.(err)
      return
    }

    setFile(selectedFile)
    setError(null)
    setIsParsing(true)

    try {
      const parsedEmails = await parseEmailList(selectedFile)
      
      if (parsedEmails.length === 0) {
        const err = 'No valid emails found in the file'
        setError(err)
        setFile(null)
        onError?.(err)
        return
      }

      setEmails(parsedEmails)
      onEmailsParsed(parsedEmails)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse email list'
      setError(errorMessage)
      setFile(null)
      onError?.(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }, [maxSize, onEmailsParsed, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [handleFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }, [handleFile])

  const handleRemove = useCallback(() => {
    setFile(null)
    setEmails([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onEmailsParsed([])
  }, [onEmailsParsed])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${error ? 'border-red-300 dark:border-red-600' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className={`
              inline-flex items-center justify-center w-16 h-16 rounded-full
              ${isDragging
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}>
              {isParsing ? (
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isParsing ? 'Parsing file...' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports .csv and .txt files (max {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && !isParsing && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          {/* File Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="ml-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Email Preview */}
          {emails.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preview (first 5):
                </p>
              </div>
              <ul className="space-y-1 pl-6">
                {emails.slice(0, 5).map((email, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 list-disc">
                    {email}
                  </li>
                ))}
              </ul>
              {emails.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                  ... and {emails.length - 5} more
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total: {emails.length} {emails.length === 1 ? 'email' : 'emails'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}









