'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSiteConfig, swarmConfig, type SiteConfig } from './config'

const SiteContext = createContext<SiteConfig>(swarmConfig)

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(swarmConfig)

  useEffect(() => {
    const siteConfig = getSiteConfig(window.location.hostname)
    setConfig(siteConfig)
    document.documentElement.setAttribute('data-theme', siteConfig.theme)
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
