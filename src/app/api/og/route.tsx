import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Sanitize input to prevent XSS
function sanitizeInput(input: string | null, maxLength: number = 100): string {
  if (!input) return ''
  // Remove HTML tags and limit length
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"']/g, '')
    .slice(0, maxLength)
    .trim()
}

// Honeycomb hexagon positions (static, shared across both OG variants)
const HEXAGONS = [
  // Left side (sparse, subtle)
  { x: 30, y: 80, size: 60, opacity: 0.15 },
  { x: 80, y: 180, size: 45, opacity: 0.12 },
  { x: 20, y: 300, size: 55, opacity: 0.1 },
  { x: 100, y: 400, size: 40, opacity: 0.15 },
  { x: 50, y: 500, size: 50, opacity: 0.12 },
  { x: 150, y: 120, size: 35, opacity: 0.08 },
  { x: 180, y: 280, size: 42, opacity: 0.1 },
  // Right side (denser, more visible)
  { x: 1000, y: 50, size: 65, opacity: 0.2 },
  { x: 1080, y: 130, size: 50, opacity: 0.25 },
  { x: 1020, y: 200, size: 55, opacity: 0.18 },
  { x: 1100, y: 280, size: 45, opacity: 0.22 },
  { x: 950, y: 150, size: 40, opacity: 0.15 },
  { x: 1050, y: 350, size: 60, opacity: 0.2 },
  { x: 980, y: 420, size: 48, opacity: 0.18 },
  { x: 1100, y: 450, size: 55, opacity: 0.25 },
  { x: 1020, y: 520, size: 42, opacity: 0.2 },
  { x: 1080, y: 580, size: 50, opacity: 0.22 },
  { x: 950, y: 550, size: 38, opacity: 0.15 },
  { x: 900, y: 300, size: 35, opacity: 0.12 },
  { x: 870, y: 100, size: 30, opacity: 0.1 },
  { x: 1150, y: 200, size: 35, opacity: 0.18 },
]

const OG_SIZE = { width: 1200, height: 630 }

function hexagonPath(cx: number, cy: number, size: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return `M${points.join('L')}Z`
}

const backgroundStyle = {
  height: '100%',
  width: '100%',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  background: 'linear-gradient(180deg, #fcd34d 0%, #fbbf24 50%, #f59e0b 100%)',
  fontFamily: 'system-ui, sans-serif',
  position: 'relative' as const,
}

function HoneycombSvg() {
  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      viewBox="0 0 1200 630"
    >
      {HEXAGONS.map((hex, i) => (
        <path
          key={i}
          d={hexagonPath(hex.x, hex.y, hex.size)}
          fill="none"
          stroke="#d97706"
          strokeWidth="2"
          opacity={hex.opacity}
        />
      ))}
    </svg>
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Sanitize all inputs
  const title = sanitizeInput(searchParams.get('title'), 200)
  const description = sanitizeInput(searchParams.get('description'), 300)
  const author = sanitizeInput(searchParams.get('author'), 100)
  const ratingParam = searchParams.get('rating')
  const rating = ratingParam ? Math.min(Math.max(parseFloat(ratingParam), 0), 5).toFixed(1) : null

  // Check if this is a swarm-specific OG image
  const isSwarmPage = title && title !== 'AuditSwarm'

  const content = isSwarmPage ? (
    // Swarm-specific content card
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 50,
        maxWidth: 900,
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          fontSize: 24,
          fontWeight: 700,
          color: '#d97706',
        }}
      >
        AuditSwarm
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: '#1a1a1a',
          marginBottom: 16,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>

      {description && (
        <p
          style={{
            fontSize: 26,
            color: '#525252',
            marginBottom: 24,
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontSize: 20,
          color: '#737373',
        }}
      >
        {author && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8, fontSize: 18 }}>by</span>
            <span style={{ fontWeight: 600, color: '#525252' }}>{author}</span>
          </div>
        )}

        {rating && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 6, color: '#f59e0b' }}>★</span>
            {rating}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          Workflow Template
        </div>
      </div>
    </div>
  ) : (
    // Landing page content
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(254, 243, 199, 0.9)',
          color: '#92400e',
          padding: '12px 24px',
          borderRadius: 9999,
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 40,
          border: '1px solid #fcd34d',
        }}
      >
        Community-Driven Workflow Templates
      </div>

      <h1
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: '#1a1a1a',
          marginBottom: 24,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        AuditSwarm
      </h1>

      <p
        style={{
          fontSize: 32,
          color: '#525252',
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
          marginBottom: 48,
        }}
      >
        Move beyond prompt engineering. Discover, share, and save
        workflow templates for all your auditing needs.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f59e0b',
          color: '#000',
          padding: '16px 40px',
          borderRadius: 8,
          fontSize: 22,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        Browse Templates
      </div>
    </>
  )

  return new ImageResponse(
    (
      <div style={backgroundStyle}>
        <HoneycombSvg />
        {content}
      </div>
    ),
    OG_SIZE
  )
}
