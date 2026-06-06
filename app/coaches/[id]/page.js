'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// ─── Helpers ────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_ABBR    = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

function fmt12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

function getSlots(dateStr, availRow, bookedSet, duration = 60) {
  const slots = []
  const [sh, sm] = availRow.start_time.slice(0,5).split(':').map(Number)
  const [eh, em] = availRow.end_time.slice(0,5).split(':').map(Number)
  let cur = sh * 60 + sm
  const last = eh * 60 + em - duration
  while (cur <= last) {
    const hh = String(Math.floor(cur/60)).padStart(2,'0')
    const mm = String(cur%60).padStart(2,'0')
    const key = `${dateStr}T${hh}:${mm}`
    if (!bookedSet.has(key)) slots.push(`${hh}:${mm}`)
    cur += duration
  }
  return slots
}
// ─────────────────────────────────────────────────────────────

export default function CoachProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [coach,         setCoach]         = useState(null)
  const [reviews,       setReviews]       = useState([])
  const [availability,  setAvailability]  = useState([])
  const [bookedSet,     setBookedSet]     = useState(new Set())
  const [selectedDate,  setSelectedDate]  = useState(null)
  const [loading,       setLoading]       = useState(true)
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

      const { data: av } = await supabase
        .from('availability')
        .select('*')
        .eq('coach_id', id)
      setAvailability(av || [])

      const from = new Date().toISOString()
      const to   = new Date(Date.now() + 28*24*60*60*1000).toISOString()
      const { data: bk } = await supabase
        .from('bookings')
        .select('start_time, duration_mins')
        .eq('coach_id', id)
        .eq('status', 'confirmed')
        .gte('start_time', from)
        .lte('start_time', to)

      const set = new Set()
      ;(bk || []).forEach(b => {
        const dt = new Date(b.start_time)
        const dateStr = toDateStr(dt)
        const hh = String(dt.getHours()).padStart(2,'0')
        const mm = String(dt.getMinutes()).padStart(2,'0')
        set.add(`${dateStr}T${hh}:${mm}`)
      })
      setBookedSet(set)

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-400">Loading...</div>
  if (!coach)  return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Coach not found.</div>

  const stars = n => '★'.repeat(n) + '☆'.repeat(5-n)

  const availMap = Object.fromEntries(availability.map(r => [r.day_of_week, r]))
  const next21 = Array.from({ length: 21 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    return {
      date:    toDateStr(d),
      day:     d.getDate(),
      month:   MONTH_NAMES[d.getMonth()],
      dayAbbr: DAY_ABBR[dow],
      hasAvail: !!availMap[dow],
      dow,
    }
  }).filter(d => d.hasAvail)

  const selectedSlots = selectedDate
    ? getSlots(selectedDate, availMap[new Date(selectedDate + 'T12:00').getDay()], bookedSet)
    : []

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/coaches" className="text-blue-700 text-sm font-medium hover:underline mb-6 inline-block">← Back to coaches</Link>

        <div className="grid md:grid-cols-3 gap-6">

          {/* ── LEFT: Profile + Reviews ── */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-8">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-3xl flex-shrink-0">
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
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">UTR Rating</p>
                    <p className="text-2xl font-black text-blue-800 mt-1">{coach.utr_rating}</p>
                    {coach.utr_verified && <p className="text-xs text-blue-600 mt-0.5">✓ Verified</p>}
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

          {/* ── RIGHT: Pricing + Availability Booking ── */}
          <div className="space-y-4">
            <div className="card p-6">

              {/* Rate */}
              <p className="text-3xl font-black text-gray-900">
                ${coach.hourly_rate}
                <span className="text-gray-400 font-normal text-base">/hr</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">No hidden fees — you see what you pay</p>

              {/* Session type chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {coach.session_types?.includes('in-person') && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">In-person</span>
                )}
                {coach.session_types?.includes('online') && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Online</span>
                )}
                {coach.travels_to_student && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">Travels to you</span>
                )}
              </div>

              {/* ── Availability Calendar ── */}
              <div className="mt-6">
                <p className="text-sm font-bold text-gray-900 mb-3">Select a date</p>

                {next21.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">No availability set yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Check back soon or browse other coaches.</p>
                  </div>
                ) : (
                  <>
                    {/* Date chips — horizontally scrollable */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {next21.map(d => (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(selectedDate === d.date ? null : d.date)}
                          className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border transition-colors text-xs
                            ${selectedDate === d.date
                              ? 'bg-blue-800 text-white border-blue-800'
                              : 'border-gray-200 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                        >
                          <span className="font-medium opacity-75">{d.dayAbbr}</span>
                          <span className="font-black text-base mt-0.5">{d.day}</span>
                          <span className="font-medium opacity-75 mt-0.5">{d.month}</span>
                        </button>
                      ))}
                    </div>

                    {/* Time slots for selected date */}
                    {selectedDate && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Available times
                        </p>
                        {selectedSlots.length === 0 ? (
                          <p className="text-sm text-gray-400">All slots on this date are booked. Try another day.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedSlots.map(slot => (
                              <Link
                                key={slot}
                                href={`/book/${coach.id}?date=${selectedDate}&time=${slot}&duration=60`}
                                className="text-center py-2 px-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-800 hover:bg-blue-800 hover:text-white hover:border-blue-800 transition-colors"
                              >
                                {fmt12(slot)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedDate && (
                      <p className="text-xs text-gray-400 mt-3 text-center">Pick a date to see open slots</p>
                    )}
                  </>
                )}
              </div>

              {/* Trust note */}
              <p className="text-xs text-gray-400 text-center mt-5 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure booking · You won't be charged yet
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
