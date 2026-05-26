'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function CoachProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [coach, setCoach] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: coachData } = await supabase
        .from('coach_profiles')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', id)
        .single()
      setCoach(coachData)

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, profiles:student_id(full_name)')
        .eq('coach_id', id)
        .order('created_at', { ascending: false })
        .limit(10)
      setReviews(reviewData || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">Loading...</div>
  if (!coach) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Coach not found.</div>

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/coaches" className="text-green-700 text-sm font-medium hover:underline mb-6 inline-block">← Back to coaches</Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Profile */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-8">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center text-green-800 font-bold text-3xl flex-shrink-0">
                  {coach.profiles?.full_name?.[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900">{coach.profiles?.full_name}</h1>
                  <p className="text-gray-500 mt-1">{coach.city}{coach.state ? `, ${coach.state}` : ''}</p>
                  {coach.primary_venue && <p className="text-sm text-gray-400 mt-0.5">📍 {coach.primary_venue}</p>}
                  {coach.rating_avg > 0 && (
                    <p className="text-amber-500 mt-1 text-sm">{stars(Math.round(coach.rating_avg))} <span className="text-gray-400">({coach.review_count} reviews)</span></p>
                  )}
                </div>
              </div>

              {coach.bio && (
                <div className="mt-6">
                  <h2 className="font-bold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{coach.bio}</p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                {coach.utr_rating && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">UTR Rating</p>
                    <p className="text-2xl font-black text-green-800 mt-1">{coach.utr_rating}</p>
                    {coach.utr_verified && <p className="text-xs text-green-600 mt-0.5">✓ Verified</p>}
                  </div>
                )}
                {coach.college_level && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">College</p>
                    <p className="text-sm font-bold text-blue-800 mt-1">{coach.college_level}</p>
                    {coach.college_school && <p className="text-xs text-blue-600 mt-0.5">{coach.college_school}</p>}
                  </div>
                )}
              </div>

              {coach.specialties?.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-bold text-gray-900 mb-3">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map(s => (
                      <span key={s} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {coach.languages?.length > 0 && (
                <div className="mt-4">
                  <h2 className="font-bold text-gray-900 mb-2">Languages</h2>
                  <p className="text-gray-600 text-sm">{coach.languages.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="card p-8">
                <h2 className="font-bold text-gray-900 mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{r.profiles?.full_name || 'Student'}</p>
                        <p className="text-amber-500 text-sm">{stars(r.rating)}</p>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking card */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-24">
              <p className="text-3xl font-black text-gray-900">${coach.hourly_rate}<span className="text-gray-400 font-normal text-base">/hr</span></p>
              <p className="text-xs text-gray-400 mt-1">15% platform fee included</p>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{coach.session_types?.includes('in-person') ? '✓' : '✗'}</span>
                  <span>In-person sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{coach.session_types?.includes('online') ? '✓' : '✗'}</span>
                  <span>Online sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{coach.travels_to_student ? '✓' : '✗'}</span>
                  <span>Travels to your court</span>
                </div>
              </div>

              <Link href={`/book/${coach.id}`}
                className="btn-primary w-full text-center block mt-6">
                Book a Session
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
