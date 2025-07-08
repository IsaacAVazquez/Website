import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Isaac Vazquez – QA Engineer & Builder'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 50%, #A855F7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 60px',
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              marginBottom: 20,
              letterSpacing: '-0.02em',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Isaac Vazquez
          </h1>
          <p
            style={{
              fontSize: 36,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            QA Engineer & Builder
          </p>
          <p
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 300,
              marginTop: 20,
              maxWidth: 800,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Crafting reliable, user-centered products for a better democracy
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}