import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://openauditswarms.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/upload`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Dynamic agent pages
  try {
    const supabase = await createClient()
    const { data: agents } = await supabase
      .from('agents')
      .select('slug, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(1000) // Limit for performance
      .returns<Array<{ slug: string; updated_at: string }>>()

    const agentPages: MetadataRoute.Sitemap = (agents || []).map((agent) => ({
      url: `${baseUrl}/agents/${agent.slug}`,
      lastModified: new Date(agent.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...agentPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
