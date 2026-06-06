import { createClient } from '@/lib/supabase-server'

export async function generateMetadata({ params }) {
  const supabase = createClient()
  const { data: coach } = await supabase
    .from('coach_profiles')
    .select('*, profiles(full_name)')
    .eq('id', params.id)
    .single()

  if (!coach) {
    return {
      title: 'Tennis Coach Profile | TennisCoach',
      description: 'View coach credentials and book a session on TennisCoach.',
    }
  }

  const name = coach.profiles?.full_name || 'Tennis Coach'
  const utr = coach.utr_rating ? `UTR ${coach.utr_rating}` : null
  const city = coach.city || null
  const rate = coach.hourly_rate ? `$${coach.hourly_rate}/hr` : null

  const descParts = [utr, city, rate].filter(Boolean)
  const description = descParts.length > 0
    ? `${name} — ${descParts.join(' · ')}. Book a session directly on TennisCoach.`
    : `View ${name}'s coaching profile, credentials, and reviews. Book on TennisCoach.`

  const title = `${name} | Tennis Coach on TennisCoach`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'TennisCoach',
      type: 'profile',
      url: `https://serveup-puce.vercel.app/coaches/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function CoachProfileLayout({ children }) {
  return children
}
