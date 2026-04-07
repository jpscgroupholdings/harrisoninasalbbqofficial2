// hooks/useSubdomainUrl.ts
'use client'
import { useState, useEffect } from 'react'
import { getSubdomainUrl, getSubdomainPath } from '@/helper/navigation'

export function useSubdomainUrl(subdomain?: string) {
  const [url, setUrl] = useState('#')

  useEffect(() => {
    setUrl(getSubdomainUrl(subdomain))
  }, [subdomain])

  return url
}

export function useSubdomainPath(path: string, subdomain?: string) {
  const [url, setUrl] = useState('#')

  useEffect(() => {
    setUrl(getSubdomainPath(path, subdomain))
  }, [path, subdomain])

  return url
}