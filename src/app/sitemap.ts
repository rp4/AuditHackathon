import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'

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
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Dynamic swarm pages
  try {
    const swarms = await prisma.swarm.findMany({
      where: { isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    })

    const swarmPages: MetadataRoute.Sitemap = swarms.map((swarm) => ({
      url: `${baseUrl}/swarms/${swarm.slug}`,
      lastModified: swarm.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...swarmPages]
  } catch {
    // If database is unavailable, return static pages only
    return staticPages
  }
}
