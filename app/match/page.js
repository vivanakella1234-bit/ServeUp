'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import CoachCard from '@/components/CoachCard'
import Link from 'next/link'

const STEPS = [
  {
    id: 'level',
    question: "What's your playing level?",
    emoji: '🎾',
    options: [
      { label: 'Complete beginner', value: 'beginner', desc: 'Just picking up a racket' },
      { label: 'Recreational', value: 'recreational', desc: 'Play for fun, want to improve' },
      { label: 'Competitive club', value: 'competitive', desc: 'League play, tournaments' },
      { label: 'High-level', value: 'advanced', desc: 'College / ranked player' },
    ],
  },
  {
    id: 'goal',
    question: "What's your main goal?",
    emoji: '🎯',
    options: [
      { label: 'Learn the basics', value: 'basics', desc: 'Fundamentals from scratch' },
      { label: 'Fix a specific shot', value: 'technique', desc: 'Serve, backhand, footwork…' },
      { label: 'Compete and win', value: 'compete', desc: 'Tournament & match prep' },
      { label: 'Stay active', value: 'fitness', desc: 'Fun, cardio, consistency' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your budget per session?',
    emoji: '💰',
    options: [
      { label: 'Under $60 / hr', value: 60, desc: 'Budget-friendly options' },
      { label: '$60 – $90 / hr', value: 90, desc: 'Mid-range coaches' },
      { label: '$90 – $120 / hr', value: 120, desc: 'Experienced coaches' },
      { label: '$120+ / hr', value: 500, desc: 'Elite & pro-background' },
    ],
  },
  {
    id: 'format',
    question: 'How do you want to train?',
    emoji: '📍',
    options: [
      { label: 'At a club or court near me', value: 'in-person', desc: 'You go to a court' },
      { label: 'Coach comes to me', value: 'travels', desc: 'Coach travels to your court' },
      { label: 'Online video sessions', value: 'online', desc: 'Remote coaching via video' },
      { label: 'Any format works', value: 'any', desc: 'Show me everything' },
    ],
  },
  {
    id: 'city',
    question: 'What city are you in?',
    emoji: '🌆',
    isText: true,
    placeholder: 'e.g. Atlanta, Austin, Chicago…',
  },
]

function mapAnswersToFilters(answers) {
  const filters = {}

  // Budget → max hourly rate
  filters.maxRate = answers.budget || 500

  // Format → session type / travels
  if (answers.format === 'travels') filters.travels = true
  else if (answers.format !== 'any') filters.sessionType = answers.format

  // City
  if (answers.city?.trim()) filters.city = answers.city.trim()

  // Specialties derived from level + goal
  const specialties = []
  if (answers.level === 'beginner' || answers.goal === 'basics') specialties.push('Beginner development')
  if (answers.level === 'advanced' || answers.goal === 'compete') {
    specialties.push('Tournament prep')
    specialties.push('Junior competition')
  }
  if (answers.goal === 'technique') specialties.push('Serve technique')
  if (answers.goal === 'fitness' || answers.level === 'recreational') specialties.push('Adult recreational')
  filters.specialties = specialties

  return filters
}

export default function MatchPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [cityInput, setCityInput] = useState('')
  const [coaches, setCoaches] = useState(null)
  const [loading, setLoading] = useState(false)

  const currentStep = STEPS[step]
  const progress = Math.round((step / STEPS.length) * 100)

  function handleOption(value) {
    const newAnswers = { ...answers, [currentStep.id]: value }
    setAnswers(newAnswers)
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      runMatch(newAnswers)
    }
  }

  function handleCitySubmit() {
    const newAnswers = { ...answers, city: cityInput }
    setAnswers(newAnswers)
    runMatch(newAnswers)
  }

  async function runMatch(finalAnswers) {
    setLoading(true)
    const supabase = createClient()
    const filters = mapAnswersToFilters(finalAnswers)

    let query = supabase
      .from('coach_profiles')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_active', true)
      .lte('hourly_rate', filters.maxRate)
      .order('rating_avg', { ascending: false })

    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.travels) query = query.eq('travels_to_student', true)
    else if (filters.sessionType) query = query.contains('session_types', [filters.sessionType])

    // Try with specialty filter first; if empty, fall back without it
    if (filters.specialties.length > 0) {
      const { data: withSpec } = await query.overlaps('specialties', filters.specialties)
      if (withSpec && withSpec.length > 0) {
        setCoaches(withSpec)
        setLoading(false)
        return
      }
    }

    // Fallback: drop specialty filter
    const { data: fallback } = await query
    setCoaches(fallback || [])
    setLoading(false)
  }

  function restart() {
    setStep(0)
    setAnswers({})
    setCityInput('')
    setCoaches(null)
  }

  // Results screen
  if (coaches !== null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {loading ? (
            <div className="text-center py-24 text-gray-400">Finding your best matches…</div>
          ) : coaches.length > 0 ? (
            <>
              <div className="text-center mb-10">
                <div className="text-4xl mb-3">🎾</div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">
                  {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} matched for you
                </h1>
                <p className="text-gray-500">Based on your level, goals, and location.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {coaches.map(coach => <CoachCard key={coach.id} coach={coach} />)}
              </div>
              <div className="text-center">
                <button onClick={restart} className="text-sm text-gray-400 hover:text-green-700 underline">
                  Start over with different answers
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🙏</div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">No coaches in your area yet</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                We're growing fast — drop your email and we'll notify you the moment a coach joins {answers.city ? <strong>{answers.city}</strong> : 'your area'}.
              </p>
              <WaitlistForm city={answers.city} />
              <div className="mt-6">
                <button onClick={restart} className="text-sm text-gray-400 hover:text-green-700 underline">
                  Try a different city or format
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Quiz screen
  return (
    <div className="min-h-screen bg-gray-50 pt-20 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-6 py-12 flex-1 flex flex-col">

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-green-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-5xl mb-6 text-center">{currentStep.emoji}</div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-8">
            {currentStep.question}
          </h2>

          {currentStep.isText ? (
            <div className="flex flex-col items-center gap-4">
              <input
                autoFocus
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cityInput.trim() && handleCitySubmit()}
                placeholder={currentStep.placeholder}
                className="w-full max-w-sm border border-gray-200 rounded-xl px-5 py-4 text-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
              />
              <button
                onClick={handleCitySubmit}
                disabled={!cityInput.trim()}
                className="bg-green-700 text-white font-bold px-10 py-3 rounded-xl hover:bg-green-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Find My Coaches →
              </button>
              <button
                onClick={() => handleCitySubmit()}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Skip — show all locations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentStep.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOption(opt.value)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-green-500 hover:shadow-md transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-green-800 mb-0.5">{opt.label}</div>
                  <div className="text-sm text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back button */}
        {step > 0 && (
          <div className="mt-10 text-center">
            <button onClick={() => setStep(step - 1)} className="text-sm text-gray-400 hover:text-gray-600 underline">
              ← Go back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function WaitlistForm({ city }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    // Store in Supabase waitlist table (gracefully fails if table doesn't exist yet)
    try {
      const supabase = createClient()
      await supabase.from('waitlist').insert({ email: email.trim(), city: city || null })
    } catch (_) {}
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-8 py-6 max-w-sm mx-auto">
        <div className="text-2xl mb-2">✅</div>
        <p className="font-bold text-green-800">You're on the list!</p>
        <p className="text-sm text-green-700 mt-1">We'll email you as soon as a coach joins your area.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button type="submit" className="bg-green-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-800 transition whitespace-nowrap">
        Notify me
      </button>
    </form>
  )
}
