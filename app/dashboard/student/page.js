'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={(hover || value) >= star ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

function ReviewForm({ booking, studentId, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setSubmitting(true); setError('')
    const { error: err } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      coach_id: booking.coach_id,
      student_id: studentId,
      rating,
      comment: comment.trim() || null,
    })
    if (err) { setError('Could not submit review. Please try again.'); setSubmitting(false); return }
    onSubmit(booking.id)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-semibold text-gray-700 mb-3">Leave a review</p>
      <StarRating value={rating} onChange={setRating} />
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        rows={2}
        className="input mt-3 resize-none text-sm"
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary text-sm py-2 mt-3"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null)
  const [studentId, setStudentId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set())
  const [submittedIds, setSubmittedIds] = useState(new Set())
  const [openReviewId, setOpenReviewId] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(p)

      const { data: sp } = await supabase.from('student_profiles').select('id').eq('user_id', session.user.id).single()
      if (sp) {
        setStudentId(sp.id)

        const { data: b } = await supabase.from('bookings')
          .select('*, coach_profiles(*, profiles(full_name))')
          .eq('student_id', sp.id)
          .order('start_time', { ascending: false })
        setBookings(b || [])

        // Fetch which bookings already have reviews
        const completedIds = (b || []).filter(x => x.status === 'completed').map(x => x.id)
        if (completedIds.length > 0) {
          const { data: reviews } = await supabase.from('reviews')
            .select('booking_id')
            .in('booking_id', completedIds)
          setReviewedBookingIds(new Set((reviews || []).map(r => r.booking_id)))
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleReviewSubmitted(bookingId) {
    setSubmittedIds(prev => new Set([...prev, bookingId]))
    setOpenReviewId(null)
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">Loading...</div>

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
  const past = bookings.filter(b => b.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {profile?.full_name}</p>
          </div>
          <Link href="/coaches" className="btn-primary text-sm py-2">Find a Coach</Link>
        </div>

        {/* Upcoming */}
        <div className="card p-8 mb-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Upcoming Sessions</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No upcoming sessions.</p>
              <Link href="/coaches" className="btn-primary text-sm mt-4 inline-block">Book your first session →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{b.coach_profiles?.profiles?.full_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{new Date(b.start_time).toLocaleString()} · {b.duration_mins} min</p>
                    {b.location_address && <p className="text-xs text-gray-400 mt-0.5">📍 {b.location_address}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${(b.total_amount/100).toFixed(0)}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past sessions */}
        {past.length > 0 && (
          <div className="card p-8">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Past Sessions</h2>
            <div className="space-y-3">
              {past.map(b => {
                const alreadyReviewed = reviewedBookingIds.has(b.id) || submittedIds.has(b.id)
                const isOpen = openReviewId === b.id

                return (
                  <div key={b.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{b.coach_profiles?.profiles?.full_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{new Date(b.start_time).toLocaleDateString()} · {b.duration_mins} min</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {alreadyReviewed ? (
                          <span className="text-xs text-blue-600 font-semibold">✓ Reviewed</span>
                        ) : (
                          <button
                            onClick={() => setOpenReviewId(isOpen ? null : b.id)}
                            className="text-xs font-semibold text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            {isOpen ? 'Cancel' : 'Leave a Review'}
                          </button>
                        )}
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Completed</span>
                      </div>
                    </div>

                    {isOpen && !alreadyReviewed && (
                      <ReviewForm
                        booking={b}
                        studentId={studentId}
                        onSubmit={handleReviewSubmitted}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
