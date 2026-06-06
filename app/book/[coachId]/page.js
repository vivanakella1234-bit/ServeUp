'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function BookCoach() {
  const { coachId } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const wasCancelled = searchParams.get('cancelled') === 'true'
  // Pre-fill from availability calendar link params
  const preDate     = searchParams.get('date')     || ''
  const preTime     = searchParams.get('time')     || ''
  const preDuration = parseInt(searchParams.get('duration') || '60')

  const [coach, setCoach] = useState(null)
  const [student, setStudent] = useState(null)
  const [date, setDate] = useState(preDate)
  const [time, setTime] = useState(preTime)
  const [duration, setDuration] = useState(preDuration)
  const [location, setLocation] = useState('')
  const [useCoachVenue, setUseCoachVenue] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data: c } = await supabase.from('coach_profiles')
        .select('*, profiles(full_name)').eq('id', coachId).single()
      setCoach(c)
      if (c?.primary_venue) setLocation(c.primary_venue)
      const { data: sp } = await supabase.from('student_profiles')
        .select('*').eq('user_id', session.user.id).single()
      if (!sp) {
        // Auto-create student profile
        const { data: newSp } = await supabase.from('student_profiles')
          .insert({ user_id: session.user.id }).select().single()
        setStudent(newSp)
      } else setStudent(sp)
      setLoading(false)
    }
    load()
  }, [coachId])

  const totalCents = coach ? Math.round((coach.hourly_rate * duration / 60) * 100) : 0
  const platformFee = Math.round(totalCents * 0.10)
  const coachPayout = totalCents - platformFee

  async function handleBook(e) {
    e.preventDefault()
    if (!date || !time) { setError('Please select a date and time.'); return }
    setBooking(true); setError('')
    const startTime = new Date(`${date}T${time}`)
    const endTime = new Date(startTime.getTime() + duration * 60000)
    const finalLocation = useCoachVenue ? (coach.primary_venue || '') : location

    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coachId,
        studentId: student.id,
        coachName: coach.profiles?.full_name,
        studentEmail: session?.user?.email,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMins: duration,
        locationAddress: finalLocation,
        totalAmount: totalCents,
        platformFee,
        coachPayout,
        notes,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error || 'Something went wrong. Please try again.')
      setBooking(false)
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">Loading...</div>
  if (!coach) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Coach not found.</div>

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href={`/coaches/${coachId}`} className="text-blue-700 text-sm font-medium hover:underline mb-6 inline-block">← Back to profile</Link>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Book a Session</h1>
        <p className="text-gray-500 text-sm mb-8">with <span className="font-semibold text-gray-700">{coach.profiles?.full_name}</span></p>

        <div className="card p-8">
          {wasCancelled && (
            <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
              Payment was cancelled — your booking was not confirmed. You can try again below.
            </div>
          )}
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          <form onSubmit={handleBook} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Date *</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} required
                  min={new Date().toISOString().split('T')[0]} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Time *</label>
                <input type="time" value={time} onChange={e=>setTime(e.target.value)} required className="input" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Session Length</label>
              <div className="flex gap-2">
                {[60,90,120].map(d => (
                  <button type="button" key={d} onClick={()=>setDuration(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${duration===d ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
              {coach.primary_venue && (
                <div className="flex gap-3 mb-3">
                  <button type="button" onClick={()=>{setUseCoachVenue(true);setLocation(coach.primary_venue)}}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${useCoachVenue ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 text-gray-600'}`}>
                    Coach's venue
                  </button>
                  <button type="button" onClick={()=>{setUseCoachVenue(false);setLocation('')}}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!useCoachVenue ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 text-gray-600'}`}>
                    My court
                  </button>
                </div>
              )}
              {useCoachVenue && coach.primary_venue
                ? <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl">📍 {coach.primary_venue}</p>
                : <input value={location} onChange={e=>setLocation(e.target.value)} className="input" placeholder="Enter your court address" />
              }
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes for coach (optional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="input resize-none"
                placeholder="Your skill level, what you'd like to work on..." />
            </div>

            {/* Price summary */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">${coach.hourly_rate}/hr × {duration} min</span>
                <span className="font-semibold">${(totalCents/100).toFixed(2)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-800">
                <span>Total charged</span>
                <span>${(totalCents/100).toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" disabled={booking} className="btn-primary w-full">
              {booking ? 'Redirecting to payment...' : `Pay & Confirm — $${(totalCents/100).toFixed(2)}`}
            </button>
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Secure payment powered by Stripe
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
                                                                                                                                                                                                             