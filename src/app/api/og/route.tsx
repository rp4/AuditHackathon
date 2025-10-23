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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Sanitize all inputs
  const title = sanitizeInput(searchParams.get('title'), 200) || 'OpenAuditSwarms'
  const description = sanitizeInput(searchParams.get('description'), 300) || 'AI Agent Sharing Platform for Auditors'
  const author = sanitizeInput(searchParams.get('author'), 100)
  const ratingParam = searchParams.get('rating')
  const rating = ratingParam ? Math.min(Math.max(parseFloat(ratingParam), 0), 5).toFixed(1) : null

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Title Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 20,
            }}
          >
            🤖 OpenAuditSwarms
          </div>
        </div>

        {/* Content Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 60,
            maxWidth: 900,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
        >
          <h1
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: 20,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: 28,
              color: '#4a5568',
              marginBottom: 30,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              fontSize: 22,
              color: '#718096',
            }}
          >
            {author && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>👤</span>
                {author}
              </div>
            )}

            {rating && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>⭐</span>
                {rating} rating
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>🔗</span>
              Platform-Agnostic
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
