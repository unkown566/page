/**
 * Loading Screen Registry
 * Admin configures which screen to use per link
 */

import MeetingInviteScreen from '@/components/loading/MeetingInviteScreen'
import VoiceMessageScreen from '@/components/loading/VoiceMessageScreen'
import EFaxScreen from '@/components/loading/EFaxScreen'
import PackageDeliveryScreen from '@/components/loading/PackageDeliveryScreen'
import SecureFileTransferScreen from '@/components/loading/SecureFileTransferScreen'
import InvoiceDocumentScreen from '@/components/loading/InvoiceDocumentScreen'
import TimesheetScreen from '@/components/loading/TimesheetScreen'
import CloudStorageScreen from '@/components/loading/CloudStorageScreen'
import CompanyNoticeScreen from '@/components/loading/CompanyNoticeScreen'
import HankoDocumentScreen from '@/components/loading/HankoDocumentScreen'

export const LOADING_SCREENS = {
  meeting: {
    id: 'meeting',
    name: '会議招待 (Meeting Invite)',
    nameEn: 'Meeting Invite',
    component: MeetingInviteScreen,
    icon: '📅',
    category: 'business'
  },
  voice: {
    id: 'voice',
    name: '音声メッセージ (Voice Message)',
    nameEn: 'Voice Message',
    component: VoiceMessageScreen,
    icon: '🎤',
    category: 'communication'
  },
  efax: {
    id: 'efax',
    name: 'FAX文書 (E-Fax Document)',
    nameEn: 'E-Fax Document',
    component: EFaxScreen,
    icon: '📠',
    category: 'document'
  },
  package: {
    id: 'package',
    name: '配送通知 (Package Delivery)',
    nameEn: 'Package Delivery',
    component: PackageDeliveryScreen,
    icon: '📦',
    category: 'notification'
  },
  fileTransfer: {
    id: 'fileTransfer',
    name: 'ファイル転送 (Secure File Transfer)',
    nameEn: 'Secure File Transfer',
    component: SecureFileTransferScreen,
    icon: '🔒',
    category: 'business'
  },
  invoice: {
    id: 'invoice',
    name: '請求書 (Invoice Document)',
    nameEn: 'Invoice Document',
    component: InvoiceDocumentScreen,
    icon: '💰',
    category: 'financial'
  },
  timesheet: {
    id: 'timesheet',
    name: '勤怠記録 (Timesheet)',
    nameEn: 'Timesheet',
    component: TimesheetScreen,
    icon: '📊',
    category: 'hr'
  },
  cloudStorage: {
    id: 'cloudStorage',
    name: 'クラウドストレージ (Cloud Storage)',
    nameEn: 'Cloud Storage',
    component: CloudStorageScreen,
    icon: '☁️',
    category: 'storage'
  },
  companyNotice: {
    id: 'companyNotice',
    name: '社内通知 (Company Notice)',
    nameEn: 'Company Notice',
    component: CompanyNoticeScreen,
    icon: '📢',
    category: 'internal'
  },
  hanko: {
    id: 'hanko',
    name: '電子印鑑文書 (Digital Hanko Document)',
    nameEn: 'Digital Stamp Document',
    component: HankoDocumentScreen,
    icon: '🏛️',
    category: 'legal'
  }
} as const

export type LoadingScreenId = keyof typeof LOADING_SCREENS

export function getLoadingScreen(id: LoadingScreenId | string) {
  const screenId = id as LoadingScreenId
  return LOADING_SCREENS[screenId] || LOADING_SCREENS.meeting
}

// For admin dropdown
export function getLoadingScreenOptions() {
  return Object.entries(LOADING_SCREENS).map(([id, screen]) => ({
    value: id,
    label: screen.name,
    labelEn: screen.nameEn,
    icon: screen.icon,
    category: screen.category
  }))
}








