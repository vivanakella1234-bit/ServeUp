export const metadata = {
  title: 'Find Tennis Coaches Near You | ServeUp',
  description: 'Browse verified tennis coaches in your city. Filter by UTR level, hourly rate, and specialty. Book and pay instantly on ServeUp.',
  keywords: 'find tennis coach, tennis coach near me, local tennis coach, book tennis coach, UTR tennis coach, private tennis lessons',
  openGraph: {
    title: 'Find Tennis Coaches Near You | ServeUp',
    description: 'Browse verified tennis coaches in your city. Filter by UTR level, hourly rate, and specialty.',
    url: 'https://serveup-puce.vercel.app/coaches',
    siteName: 'ServeUp',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tennis Coaches Near You | ServeUp',
    description: 'Browse verified tennis coaches in your city. Filter by UTR level, rate, and specialty.',
  },
}

export default function CoachesLayout({ children }) {
  return children
}
