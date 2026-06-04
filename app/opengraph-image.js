import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ServeUp — Find Your Tennis Coach'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', fontWeight: 'bold', color: 'white', letterSpacing: '-2px' }}>
            Serve<span style={{ color: '#86efac' }}>Up</span>
          </div>
        </div>
        <div
          style={{
            fontSize: '52px',
            fontWeight: 'black',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          Find your tennis coach.
        </div>
        <div
          style={{
            fontSize: '26px',
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.4,
            marginBottom: '40px',
          }}
        >
          UTR-verified coaches. Book and pay instantly. Any city.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['UTR Verified', 'Book Instantly', 'Any City'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '999px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
