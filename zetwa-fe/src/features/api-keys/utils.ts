/**
 * API Keys Feature - Utility Functions
 */

import { toast } from 'sonner'
import type { ApiKey } from './types'

/**
 * Check if an API key has expired
 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/**
 * Get status of an API key
 */
export function getKeyStatus(
  key: ApiKey
): 'active' | 'inactive' | 'expired' {
  if (isExpired(key.expiresAt)) return 'expired'
  if (!key.isActive) return 'inactive'
  return 'active'
}

/**
 * Format a date for display (past dates)
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format expiration date (future dates)
 */
export function formatExpirationDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  
  // If already expired, use past format
  if (diffMs < 0) {
    return formatRelativeDate(dateString)
  }
  
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'in a moment'
  if (diffMins < 60) return `in ${diffMins}m`
  if (diffHours < 24) return `in ${diffHours}h`
  if (diffDays === 1) return 'tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`
  if (diffDays < 30) return `in ${Math.floor(diffDays / 7)} weeks`
  if (diffDays < 365) return `in ${Math.floor(diffDays / 30)} months`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Copy text to clipboard with toast notification
 */
export async function copyToClipboard(text: string, label = 'Copied to clipboard'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label)
    return true
  } catch {
    toast.error('Failed to copy to clipboard')
    return false
  }
}

/**
 * Generate usage example code
 */
export function generateUsageExample(keyPreview: string): string {
  return `# Using curl
curl -X GET "https://api.yourserver.com/api/sessions" \\
  -H "X-API-Key: ${keyPreview}"

# Using JavaScript/TypeScript
const response = await fetch('https://api.yourserver.com/api/sessions', {
  headers: {
    'X-API-Key': '${keyPreview}'
  }
});

# Using Python
import requests

response = requests.get(
    'https://api.yourserver.com/api/sessions',
    headers={'X-API-Key': '${keyPreview}'}
)`
}

/**
 * Get scope badge color based on action type
 */
export function getScopeBadgeVariant(scope: string): 'default' | 'secondary' | 'outline' {
  if (scope.endsWith(':write') || scope.endsWith(':send')) {
    return 'default'
  }
  return 'secondary'
}

/**
 * Format usage count with abbreviation
 */
export function formatUsageCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
  return `${(count / 1000000).toFixed(1)}M`
}

/**
 * Get minimum date for expiration input (tomorrow)
 */
export function getMinExpirationDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

/**
 * Validate API key name
 */
export function validateKeyName(name: string): string | null {
  if (!name.trim()) return 'Name is required'
  if (name.trim().length < 3) return 'Name must be at least 3 characters'
  if (name.length > 100) return 'Name cannot exceed 100 characters'
  return null
}
