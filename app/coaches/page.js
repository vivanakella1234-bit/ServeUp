'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CoachCard from '@/components/CoachCard'

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [maxRate, setMaxRate] = useState(300)
  const [sessionType, setSessionType] = useState('all')
  const [specialty, setSpecialty] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchCoaches() }, [city, maxRate, sessionType, specialty])

  async function fetchCoaches() {
    setLoading(true)
    let query = supabase
      .from('coach_profiles')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_active', true)
      .lte('hourly_rate', maxRate)
      .order('rating_avg', { ascending: false })

    if (city.trim()) query = query.ilike('city', `%${city.trim()}%`)
    if (sessionType !== 'all') {
      if (sessionType === 'travels') query = query.eq('travels_to_student', true)
      else query = query.contains('session_types', [sessionType])
    }
    if (specialty) query = query.contains('specialties', [specialty])

    const { data } = await query
    setCoaches(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Search header */}
      <div className="bg-green-800 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-6">Find a Coach</h1>
          <div className="grid md:grid-cols-4 gap-3">
            <input
              value={city} onChange={e => setCity(e.target.value)}
              placeholder="City or state..."
              className="input md:col-span-1"
            />
            <select value={sessionType} onChange={e => setSessionType(e.target.value)} className="input">
              <option value="all">All session types</option>
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
              <option value="travels">Coach travels to me</option>
            </select>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="input">
              <option value="">All specialties</option>
              <option value="Beginner development">Beginner development</option>
              <option value="Junior competition">Junior competition</option>
              <option value="Adult recreational">Adult recreational</option>
              <option value="Tournament prep">Tournament prep</option>
              <option value="Serve technique">Serve technique</option>
            </select>
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500 whitespace-nowrap">Max:</span>
              <input type="range" min={20} max={500} value={maxRate}
                onChange={e => setMaxRate(Number(e.target.value))}
                className="flex-1 accent-green-600" />
              <span className="text-sm font-semibold text-green-800 whitespace-nowrap">${maxRate}/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading coaches...</div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No coaches found in that area yet.</p>
            <p className="text-gray-400 text-sm mt-2">Try a different city or check back soon — we're growing fast.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{coaches.length} coach{coaches.length !== 1 ? 'es' : ''} found</p>
            <div className="grid md:grid-cols-2 gap-4">
              {coaches.map(coach => <CoachCard key={coach.id} coach={coach} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
