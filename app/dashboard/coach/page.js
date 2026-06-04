'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// 30-min time options from 5:00 AM to 10:00 PM
const TIME_OPTIONS = []
for (let h = 5; h <= 22; h++) {
  for (let m of [0, 30]) {
    if (h === 22 && m === 30) continue
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}

function fmt12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

const defaultAvail = () => Object.fromEntries(
  [0,1,2,3,4,5,6].map(d => [d, { active: false, start: '09:00', end: '17:00' }])
)

export default function CoachDashboard() {
  const [profile, setProfile] = useState(null)
  const [coachProfile, setCoachProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAvail, setSavingAvail] = useState(false)
  const [availSaved, setAvailSaved] = useState(false)
  const [avail, setAvail] = useState(defaultAvail())
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
      if (cp) {
        setCoachProfile(cp)
        setForm({...form, ...cp})
        // Load availability
        const { data: av } = await supabase.from('availability').select('*').eq('coach_id', cp.id)
        if (av && av.length > 0) {
          const next = defaultAvail()
          av.forEach(row => {
            next[row.day_of_week] = {
              active: true,
              start: row.start_time.slice(0,5),
              end: row.end_time.slice(0,5),
            }
          })
          setAvail(next)
        }
        // Load bookings
        const { data: b } = await supabase.from('bookings')
          .select('*, student_profiles(*, profiles(full_name))')
          .eq('coach_id', cp.id)
          .order('start_time', { ascending: true })
        setBookings(b || [])
      } else {
        setShowProfileForm(true)
      }
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

  async function saveAvailability() {
    if (!coachProfile) return
    setSavingAvail(true)
    setAvailSaved(false)
    // Delete all existing rows for this coach, then re-insert active days
    await supabase.from('availability').delete().eq('coach_id', coachProfile.id)
    const rows = Object.entries(avail)
      .filter(([, v]) => v.active)
      .map(([day, v]) => ({
        coach_id: coachProfile.id,
        day_of_week: parseInt(day),
        start_time: v.start,
        end_time: v.end,
      }))
    if (rows.length > 0) {
      await supabase.from('availability').insert(rows)
    }
    setSavingAvail(false)
    setAvailSaved(true)
    setTimeout(() => setAvailSaved(false), 3000)
  }

  if (loading) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-400">Loading...</div>

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) > new Date())
  const totalEarnings = bookings.filter(b=>b.status==='completed').reduce((s,b)=>s+b.coach_payout,0)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
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

        {/* ── AVAILABILITY ── */}
        {coachProfile && (
          <div className="card p-8 mb-8">
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-bold text-gray-900 text-lg">Your Availability</h2>
              {availSaved && (
                <span className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium">✓ Saved</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6">Set the hours you're available each day. Students can only book within these windows — no direct contact info is shared.</p>

            <div className="space-y-3">
              {[0,1,2,3,4,5,6].map(day => (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  {/* Toggle + day name */}
                  <label className="flex items-center gap-2.5 cursor-pointer w-28 flex-shrink-0">
                    <div
                      onClick={() => setAvail(a => ({...a, [day]: {...a[day], active: !a[day].active}}))}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${avail[day].active ? 'bg-green-700' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${avail[day].active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className={`text-sm font-medium select-none ${avail[day].active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {DAY_NAMES[day]}
                    </span>
                  </label>

                  {/* Time pickers */}
                  {avail[day].active ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={avail[day].start}
                        onChange={e => setAvail(a => ({...a, [day]: {...a[day], start: e.target.value}}))}
                        className="input py-1.5 text-sm w-32"
                      >
                        {TIME_OPTIONS.filter(t => t < avail[day].end).map(t => (
                          <option key={t} value={t}>{fmt12(t)}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-sm">to</span>
                      <select
                        value={avail[day].end}
                        onChange={e => setAvail(a => ({...a, [day]: {...a[day], end: e.target.value}}))}
                        className="input py-1.5 text-sm w-32"
                      >
                        {TIME_OPTIONS.filter(t => t > avail[day].start).map(t => (
                          <option key={t} value={t}>{fmt12(t)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">Not available</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveAvailability}
              disabled={savingAvail}
              className="btn-primary mt-6"
            >
              {savingAvail ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        )}

        {/* Upcoming sessions */}
        <div className="card p-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Upcoming Sessions</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming sessions yet. Set your availability above — students will see your open slots and book directly through ServeUp.</p>
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
