export type SiteTheme = 'swarm' | 'allstars'

export interface SiteConfig {
  theme: SiteTheme
  name: string
  tagline: string
  logo: string
  background: string
  favicon: string
  description: string
  /** CSS class prefix for theme-specific hardcoded colors */
  brandColor: 'amber' | 'red'
  /** Secondary brand color class prefix */
  brandAccent: 'amber' | 'blue'
}

const swarmConfig: SiteConfig = {
  theme: 'swarm',
  name: 'AuditSwarm',
  tagline: 'A Workflow Library & Game',
  logo: '/queen.png',
  background: '/honeycomb.png',
  favicon: '/queen.png',
  description: 'A platform for internal auditors to discover and share AI-powered audit workflows built with context engineering.',
  brandColor: 'amber',
  brandAccent: 'amber',
}

const allstarsConfig: SiteConfig = {
  theme: 'allstars',
  name: 'Audit AllStars',
  tagline: 'The Audit All-Stars Platform',
  logo: '/star.png',
  background: '/basketballbackground.jpeg',
  favicon: '/star.png',
  description: 'The Audit All-Stars platform for internal auditors to discover and share AI-powered audit workflows.',
  brandColor: 'red',
  brandAccent: 'blue',
}

export function getSiteConfig(hostname: string): SiteConfig {
  const lower = hostname.toLowerCase()
  if (lower.includes('allstar')) {
    return allstarsConfig
  }
  return swarmConfig
}

export { swarmConfig, allstarsConfig }
