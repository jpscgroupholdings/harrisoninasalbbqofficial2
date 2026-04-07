import { parse } from 'tldts'

// lib/navigation.ts
/**
 * Get the base URL for a specific subdomain
 * @param subdomain - The subdomain (e.g., 'food', 'order') or undefined for main domain
 * @returns Full URL with protocol and domain
 */
export function getSubdomainUrl(subdomain?: string): string {
  if (typeof window === 'undefined') return ''

  const { protocol, hostname, port } = window.location

  // Localhost handling
  if (hostname.includes('localhost')) {
    return subdomain
      ? `${protocol}//${subdomain}.localhost:${port}`
      : `${protocol}//localhost:${port}`
  }

  const parsed = parse(hostname)

  // Fallback if parsing fails
  const rootDomain = parsed.domain ?? hostname

  if (!subdomain) {
    return `${protocol}//${rootDomain}`
  }

  return `${protocol}//${subdomain}.${rootDomain}`
}

/**
 * Get full URL for a path on a specific subdomain
 * @param path - The path (e.g., '/menu', '/order')
 * @param subdomain - The subdomain or undefined for main domain
 */
export function getSubdomainPath(path: string, subdomain?: string): string {
  const baseUrl = getSubdomainUrl(subdomain)
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${baseUrl}${cleanPath}`
}