import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSwarmBySlug } from '@/lib/db/swarms'
import SwarmDetailClient from './SwarmDetailClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate dynamic metadata for each swarm page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const swarm = await getSwarmBySlug(slug)

  if (!swarm) {
    return {
      title: 'Swarm Not Found',
      description: 'The requested workflow could not be found.',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'
  const title = `${swarm.name} - Audit Workflow`
  const description = swarm.description?.slice(0, 160) || `${swarm.name} audit workflow template on AuditSwarm`
  const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(swarm.name)}&description=${encodeURIComponent(description)}&author=${encodeURIComponent(swarm.user.name || 'Anonymous')}&rating=${swarm.rating_avg.toFixed(1)}`

  return {
    title,
    description,
    keywords: [
      swarm.name,
      swarm.category?.name || 'audit workflow',
      'audit template',
      'workflow automation',
      'audit process',
      'CPA',
      'internal audit',
    ].filter(Boolean),
    authors: swarm.user.name ? [{ name: swarm.user.name }] : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/swarms/${slug}`,
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${swarm.name} - Audit Workflow`,
      }],
      publishedTime: swarm.createdAt.toISOString(),
      modifiedTime: swarm.updatedAt.toISOString(),
      authors: swarm.user.name ? [swarm.user.name] : undefined,
      tags: swarm.category ? [swarm.category.name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/swarms/${slug}`,
    },
  }
}

// JSON-LD structured data for the swarm
function SwarmJsonLd({ swarm }: { swarm: NonNullable<Awaited<ReturnType<typeof getSwarmBySlug>>> }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://AuditSwarm.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: swarm.name,
    description: swarm.description,
    url: `${baseUrl}/swarms/${swarm.slug}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: swarm.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: swarm.rating_avg.toFixed(1),
      ratingCount: swarm.rating_count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    author: {
      '@type': 'Person',
      name: swarm.user.name || 'Anonymous',
    },
    datePublished: swarm.createdAt.toISOString(),
    dateModified: swarm.updatedAt.toISOString(),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default async function SwarmDetailPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch swarm data for JSON-LD (metadata is generated separately)
  const swarm = await getSwarmBySlug(slug)

  if (!swarm) {
    notFound()
  }

  return (
    <>
      <SwarmJsonLd swarm={swarm} />
      <SwarmDetailClient slug={slug} />
    </>
  )
}
