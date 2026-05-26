'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CoachDashboard() {
  const [profile, setProfile] = useState(null)
  const [coachProfile, setCoachProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    city:'', state:'', primary_venue:'', utr_rating:'', college_level:'',
    college_school:'', hourly_rate:'', bio:'', travels_to_student:false,
    specialties:[], session_types:['in-person'], languages:['English']
  })
  const supabase = createClient()
  const router = useRouter()

  const SPECIALTIES = ['Beginner development','Junior competition','Adult recreational','Tournament prep','Serve technique','Footwork','Mental game']

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(p)
      const { data: cp } = await supabase.from('coach_profiles').select('*').eq('user_id', session.user.id).single()
      if (cp) { setCoachProfile(cp); setForm({...form, ...cp}) }
      else setShowProfileForm(true)
      const { data: b } = await supabase.from('bookings')
        .select('*, student_profiles(*, profiles(full_name))')
        .eq('coach_id', cp?.id)
        .order('start_time', { ascending: true })
      setBookings(b || [])
      setLoading(false)
    }
    load()
  }, [])

  function toggleSpecialty(s) {
    setForm(f => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter(x=>x!==s) : [...f.specialties, s] }))
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const payload = { ...form, user_id: session.user.id, hourly_rate: parseInt(form.hourly_rate), utr_rating: form.utr_rating ? parseFloat(form.utr_rating) : null }
    const { data, error } = coachProfile
      ? await supabase.from('coach_profiles').update(payload).eq('user_id', session.user.id).select().single()
      : await supabase.from('coach_profiles').insert(payload).select().single()
    if (!error) { setCoachProfile(data); setShowProfileForm(false) }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">Loading...</div>

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
  const totalEarnings = bookings.filter(b=>b.status==='completed').reduce((s,b)=>s+b.coach_payout,0)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {profile?.full_name}</p>
          </div>
          <button onClick={() => setShowProfileForm(!showProfileForm)} className="btn-secondary text-sm py-2">
            {showProfileForm ? 'Cancel' : coachProfile ? 'Edit Profile' : 'Create Profile'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            ['Upcoming Sessions', upcoming.length],
            ['Total Completed', bookings.filter(b=>b.status==='completed').length],
            ['Total Earned', `$${(totalEarnings/100).toFixed(0)}`],
          ].map(([label, val]) => (
            <div key={label} className="card p-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
              <p className="text-3xl font-black text-green-800 mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* Profile form */}
        {showProfileForm && (
          <div className="card p-8 mb-8">
            <h2 className="font-bold text-gray-900 text-lg mb-6">{coachProfile ? 'Edit Your Profile' : 'Set Up Your Coach Profile'}</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">City *</label>
                  <input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required className="input" placeholder="e.g. Atlanta" /></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">State</label>
                  <input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="input" placeholder="e.g. GA" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Primary Venue (optional)</label>
                <input value={form.primary_venue} onChange={e=>setForm({...form,primary_venue:e.target.value})} className="input" placeholder="e.g. Piedmont Tennis Center" /></div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">UTR Rating</label>
                  <input type="number" step="0.1" min="1" max="16.5" value={form.utr_rating} onChange={e=>setForm({...form,utr_rating:e.target.value})} className="input" placeholder="e.g. 10.5" /></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Hourly Rate ($) *</label>
                  <input type="number" min="20" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})} required className="input" placeholder="e.g. 80" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">College Level</label>
                  <select value={form.college_level} onChange={e=>setForm({...form,college_level:e.target.value})} className="input">
                    <option value="">None / Not applicable</option>
                    <option>Division I</option><option>Division II</option><option>Division III</option><option>NAIA</option><option>Junior College</option>
                  </select></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">College / School</label>
                  <input value={form.college_school} onChange={e=>setForm({...form,college_school:e.target.value})} className="input" placeholder="e.g. Georgia Tech" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 block mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(s => (
                    <button type="button" key={s} onClick={()=>toggleSpecialty(s)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${form.specialties.includes(s) ? 'bg-green-800 text-white border-green-800' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="travels" checked={form.travels_to_student} onChange={e=>setForm({...form,travels_to_student:e.target.checked})} className="w-4 h-4 accent-green-700" />
                <label htmlFor="travels" className="text-sm text-gray-700">I'm open to traveling to the student's court</label>
              </div>
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
                <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={4} className="input resize-none" placeholder="Tell students about your coaching style and experience..." /></div>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Profile'}</button>
            </form>
          </div>
        )}

        {/* Upcoming bookings */}
        <div className="card p-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Upcoming Sessions</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming sessions yet. Your profile is live — students can find and book you.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{b.student_profiles?.profiles?.full_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{new Date(b.start_time).toLocaleString()} · {b.duration_mins} min</p>
                    {b.location_address && <p className="text-xs text-gray-400 mt-0.5">📍 {b.location_address}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-800">${(b.coach_payout/100).toFixed(0)}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
