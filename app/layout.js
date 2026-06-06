import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TennisCoach — Find Your Tennis Coach',
  description: 'Connect with verified private tennis coaches in your city. Search by UTR level, rate, and specialty. Book and pay instantly.',
  keywords: 'tennis coach, tennis lessons, private tennis coach, find tennis coach, UTR tennis, book tennis coach, tennis coaching marketplace',
  openGraph: {
    title: 'TennisCoach — Find Your Tennis Coach',
    description: 'Connect with verified private tennis coaches in your city. Search by UTR, book and pay in minutes.',
    url: 'https://serveup-puce.vercel.app',
    siteName: 'TennisCoach',
    type: 'website',
    images: [
      {
        url: 'https://serveup-puce.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TennisCoach — Find Your Tennis Coach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisCoach — Find Your Tennis Coach',
    description: 'Connect with verified private tennis coaches in your city. Search by UTR, book and pay in minutes.',
    images: ['https://serveup-puce.vercel.app/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
