import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export function maskString(str: string, visibleStart = 4, visibleEnd = 4) {
  if (str.length <= visibleStart + visibleEnd) return str
  return str.slice(0, visibleStart) + '•'.repeat(str.length - visibleStart - visibleEnd) + str.slice(-visibleEnd)
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    CONNECTED: 'bg-green-500',
    DISCONNECTED: 'bg-red-500',
    QR_READY: 'bg-yellow-500',
    INITIALIZING: 'bg-blue-500',
    AUTHENTICATING: 'bg-blue-500',
    FAILED: 'bg-red-500',
    LOGGED_OUT: 'bg-gray-500',
  }
  return colors[status] || 'bg-gray-500'
}

export function getStatusText(status: string) {
  const texts: Record<string, string> = {
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    QR_READY: 'Scan QR Code',
    INITIALIZING: 'Initializing...',
    AUTHENTICATING: 'Authenticating...',
    FAILED: 'Failed',
    LOGGED_OUT: 'Logged Out',
  }
  return texts[status] || status
}
