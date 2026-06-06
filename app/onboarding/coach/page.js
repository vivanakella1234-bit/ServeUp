'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STEPS = ['Welcome', 'Credentials', 'Your Profile', 'Rates & Location', 'Done!']

export default function CoachOnboarding() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [fullName, setFullName] = useState('')

  // Step 2 — credentials
  const [utr, setUtr] = useState('')
  const [usta, setUsta] = useState('')
  const [yearsCoaching, setYearsCoaching] = useState('')

  // Step 3 — profile
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState([])
  const SPECIALTY_OPTIONS = ['Beginner lessons', 'Advanced technique', 'Match play', 'Fitness & conditioning', 'Junior coaching', 'Adult leagues', 'Serve & return', 'Mental game']

  // Step 4 — rates
  const [hourlyRate, setHourlyRate] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [primaryVenue, setPrimaryVenue] = useState('')

  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return }
      setUserId(session.user.id)
      setFullName(session.user.user_metadata?.full_name || '')
    })
  }, [])

  function toggleSpecialty(s) {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function finishOnboarding() {
    setLoading(true); setError('')
    if (!hourlyRate || !city || !state) {
      setError('Please fill in your rate, city, and state.')
      setLoading(false); return
    }

    const { error: err } = await supabase.from('coach_profiles').upsert({
      id: userId,
      utr_rating: utr ? parseFloat(utr) : null,
      usta_rating: usta || null,
      years_coaching: yearsCoaching ? parseInt(yearsCoaching) : null,
      bio,
      specialties,
      hourly_rate: parseFloat(hourlyRate),
      city,
      state,
      primary_venue: primaryVenue,
      onboarding_complete: true,
    })

    if (err) { setError('Something went wrong: ' + err.message); setLoading(false); return }
    setStep(4)
    setLoading(false)
  }

  const progress = Math.round((step / (STEPS.length - 1)) * 100)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pt-16 pb-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-blue-800">Tennis<span className="text-blue-400">Coach</span></Link>
          <p className="text-gray-500 text-sm mt-2">Coach setup · Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress bar */}
        {step < 4 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
            <div className="bg-blue-700 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🎾</div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Welcome, {fullName?.split(' ')[0] || 'Coach'}!</h1>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Let's get your profile set up in about 2 minutes. Once it's live, students across your area will be able to find and book you instantly.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 text-left mb-6 space-y-2">
              {['Set your hourly rate — you keep what you earn', 'Tell students about your coaching style', 'List your UTR / USTA rating to build trust', 'Go live and start getting bookings'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-blue-800">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-primary w-full">Let's go →</button>
          </div>
        )}

        {/* Step 1 — Credentials */}
        {step === 1 && (
          <div className="card p-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Your credentials</h2>
            <p className="text-gray-500 text-sm mb-6">These build trust with students. Add what you have — all fields are optional.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">UTR Rating</label>
                <input value={utr} onChange={e => setUtr(e.target.value)} className="input" placeholder="e.g. 8.5" type="number" step="0.1" min="0" max="16" />
                <p className="text-xs text-gray-400 mt-1">Universal Tennis Rating (0–16 scale)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">USTA Rating</label>
                <select value={usta} onChange={e => setUsta(e.target.value)} className="input">
                  <option value="">Select rating</option>
                  {['2.5','3.0','3.5','4.0','4.5','5.0','5.5+'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Years coaching</label>
                <input value={yearsCoaching} onChange={e => setYearsCoaching(e.target.value)} className="input" placeholder="e.g. 5" type="number" min="0" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 btn-primary">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div className="card p-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Your coaching profile</h2>
            <p className="text-gray-500 text-sm mb-6">Help students understand what it's like to train with you.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="input resize-none"
                  placeholder="Tell students about your background, coaching philosophy, and what makes your sessions special..." />
                <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Specialties <span className="text-gray-400 font-normal">(pick all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_OPTIONS.map(s => (
                    <button type="button" key={s} onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${specialties.includes(s) ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Rates & Location */}
        {step === 3 && (
          <div className="card p-8">
            <h2 className="text-xl font-black text-gray-900 mb-1">Rates & location</h2>
            <p className="text-gray-500 text-sm mb-6">Students will see your rate and location when searching for coaches.</p>

            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Hourly rate (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="input pl-7" placeholder="75" type="number" min="20" />
                </div>
                <p className="text-xs text-gray-400 mt-1">You set your rate — see our <a href="/coaching-terms" className="underline hover:text-gray-600">Coaching Terms</a> for payout details</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Austin" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">State *</label>
                  <input value={state} onChange={e => setState(e.target.value)} className="input" placeholder="TX" maxLength={2} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Primary venue / court <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={primaryVenue} onChange={e => setPrimaryVenue(e.target.value)} className="input" placeholder="e.g. Lakeway Tennis Center" />
                <p className="text-xs text-gray-400 mt-1">Where you usually run sessions. Students can also suggest their own court.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={finishOnboarding} disabled={loading} className="flex-1 btn-primary">
                {loading ? 'Saving...' : 'Go live! 🎾'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">You're live!</h1>
            <p className="text-gray-500 mb-2 leading-relaxed">
              Your profile is published and students in your area can now find and book you.
            </p>
            <p className="text-gray-400 text-sm mb-8">You'll get an email the moment someone books a session.</p>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard/coach" className="btn-primary text-center">
                Go to My Dashboard
              </Link>
              <Link href="/coaches" className="text-blue-700 text-sm font-medium hover:underline">
                See how your profile looks to students →
   