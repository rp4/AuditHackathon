'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { allstarsConfig, type SiteConfig } from './config'

const SiteContext = createContext<SiteConfig>(allstarsConfig)

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [config] = useState<SiteConfig>(allstarsConfig)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'allstars')
  }, [])

  return (
    <SiteContext.Provider value={config}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSiteConfig() {
  return useContext(SiteContext)
}
