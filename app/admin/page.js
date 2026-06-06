import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'vivan.akella1234@gmail.com'

export default async function AdminDashboard() {
  // Auth check — must be the admin
  const authClient = createServerClient()
  const { data: { session } } = await authClient.auth.getSession()
  if (!session || session.user.email !== ADMIN_EMAIL) {
    redirect('/')
  }

  // Service role client — bypasses RLS to see all data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Fetch everything in parallel
  const [
    { data: coaches },
    { data: students },
    { data: bookings },
    { data: allProfiles },
  ] = await Promise.all([
    supabase.from('coach_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('student_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ])

  // Build a lookup: user_id → { full_name, email }
  // We also need emails from auth.users — pull via service role
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = {}
  const nameMap = {}
  authUsers?.users?.forEach(u => { emailMap[u.id] = u.email })
  allProfiles?.forEach(p => { nameMap[p.id] = p.full_name })

  // Enrich coaches
  const enrichedCoaches = (coaches || []).map(c => ({
    ...c,
    email: emailMap[c.id] || '—',
    full_name: nameMap[c.id] || '—',
    bookingCount: (bookings || []).filter(b => b.coach_id === c.id).length,
    completedCount: (bookings || []).filter(b => b.coach_id === c.id && b.status === 'completed').length,
    totalRevenue: (bookings || []).filter(b => b.coach_id === c.id && b.status === 'completed').reduce((s, b) => s + b.total_amount, 0),
    totalPayout: (bookings || []).filter(b => b.coach_id === c.id && b.status === 'completed').reduce((s, b) => s + b.coach_payout, 0),
  }))

  // Enrich students
  const enrichedStudents = (students || []).map(s => ({
    ...s,
    email: emailMap[s.user_id] || '—',
    full_name: nameMap[s.user_id] || '—',
    bookingCount: (bookings || []).filter(b => b.student_id === s.id).length,
    completedCount: (bookings || []).filter(b => b.student_id === s.id && b.status === 'completed').length,
    totalSpent: (bookings || []).filter(b => b.student_id === s.id && b.status === 'completed').reduce((s, b) => s + b.total_amount, 0),
  }))

  // Stats
  const totalRevenue = (bookings || []).filter(b => b.status === 'completed').reduce((s, b) => s + (b.platform_fee || 0), 0)
  const confirmedBookings = (bookings || []).filter(b => b.status === 'confirmed').length
  const completedBookings = (bookings || []).filter(b => b.status === 'completed').length
  const pendingBookings = (bookings || []).filter(b => b.status === 'pending_payment').length

  function fmt$(cents) { return cents ? `$${(cents / 100).toFixed(2)}` : '$0.00' }
  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
  function fmtDateTime(d) { return d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—' }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-6 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/" className="text-2xl font-black text-blue-400">Tennis<span className="text-white">Coach</span></Link>
            <h1 className="text-3xl font-black text-white mt-1">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Visible only to you — {ADMIN_EMAIL}</p>
          </div>
          <div className="text-right text-xs text-gray-600">Last loaded: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Coaches', value: enrichedCoaches.length, sub: `${enrichedCoaches.filter(c => c.onboarding_complete).length} fully set up` },
            { label: 'Students', value: enrichedStudents.length, sub: 'registered accounts' },
            { label: 'Platform Revenue', value: fmt$(totalRevenue), sub: `${completedBookings} completed sessions` },
            { label: 'Active Bookings', value: confirmedBookings, sub: `${pendingBookings} pending payment` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-gray-600 text-xs mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Coaches table */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4">Coaches ({enrichedCoaches.length})</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">UTR</th>
                    <th className="text-left px-4 py-3">Rate</th>
                    <th className="text-left px-4 py-3">Specialties</th>
                    <th className="text-left px-4 py-3">Bookings</th>
                    <th className="text-left px-4 py-3">Completed</th>
                    <th className="text-left px-4 py-3">Total Revenue</th>
                    <th className="text-left px-4 py-3">Their Payout</th>
                    <th className="text-left px-4 py-3">Setup</th>
                    <th className="text-left px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedCoaches.length === 0 && (
                    <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-600">No coaches yet</td></tr>
                  )}
                  {enrichedCoaches.map((c, i) => (
                    <tr key={c.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}>
                      <td className="px-4 py-3 font-semibold text-white">{c.full_name}</td>
                      <td className="px-4 py-3 text-gray-400">{c.email}</td>
                      <td className="px-4 py-3 text-gray-400">{c.city && c.state ? `${c.city}, ${c.state}` : c.city || '—'}</td>
                      <td className="px-4 py-3">
                        {c.utr_rating ? <span className="bg-blue-900 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">{c.utr_rating}</span> : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{c.hourly_rate ? `$${c.hourly_rate}/hr` : '—'}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {c.specialties?.slice(0, 3).map(s => <span key={s} className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded">{s}</span>)}
                          {c.specialties?.length > 3 && <span className="text-gray-600 text-xs">+{c.specialties.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{c.bookingCount}</td>
                      <td className="px-4 py-3 text-gray-300">{c.completedCount}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{fmt$(c.totalRevenue)}</td>
                      <td className="px-4 py-3 text-gray-400">{fmt$(c.totalPayout)}</td>
                      <td className="px-4 py-3">
                        {c.onboarding_complete
                          ? <span className="bg-blue-900 text-blue-400 text-xs px-2 py-0.5 rounded">Live</span>
                          : <span className="bg-yellow-900 text-yellow-400 text-xs px-2 py-0.5 rounded">Incomplete</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Students table */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4">Students ({enrichedStudents.length})</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Bookings</th>
                    <th className="text-left px-4 py-3">Completed</th>
                    <th className="text-left px-4 py-3">Total Spent</th>
                    <th className="text-left px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedStudents.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">No students yet</td></tr>
                  )}
                  {enrichedStudents.map((s, i) => (
                    <tr key={s.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}>
                      <td className="px-4 py-3 font-semibold text-white">{s.full_name}</td>
                      <td className="px-4 py-3 text-gray-400">{s.email}</td>
                      <td className="px-4 py-3 text-gray-300">{s.bookingCount}</td>
                      <td className="px-4 py-3 text-gray-300">{s.completedCount}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{fmt$(s.totalSpent)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* All bookings */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">All Bookings ({(bookings || []).length})</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Session Date</th>
                    <th className="text-left px-4 py-3">Coach</th>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Duration</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Platform Fee</th>
                    <th className="text-left px-4 py-3">Coach Payout</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {(bookings || []).length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-600">No bookings yet</td></tr>
                  )}
                  {(bookings || []).map((b, i) => {
                    const coachName = nameMap[b.coach_id] || b.coach_id?.slice(0, 8)
                    const student = enrichedStudents.find(s => s.id === b.student_id)
                    const studentName = student?.full_name || b.student_id?.slice(0, 8)
                    const statusColors = {
                      completed: 'bg-blue-900 text-blue-400',
                      confirmed: 'bg-blue-900 text-blue-400',
                      pending_payment: 'bg-yellow-900 text-yellow-400',
                      cancelled: 'bg-red-900 text-red-400',
                    }
                    return (
                      <tr key={b.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}>
                        <td className="px-4 py-3 text-gray-300">{fmtDateTime(b.start_time)}</td>
                        <td className="px-4 py-3 font-semibold text-white">{coachName}</td>
                        <td className="px-4 py-3 text-gray-300">{studentName}</td>
                        <td className="px-4 py-3 text-gray-400">{b.duration_mins} min</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{b.location_address || '—'}</td>
                        <td className="px-4 py-3 text-white font-semibold">{fmt$(b.total_amount)}</td>
                        <td className="px-4 py-3 text-blue-400">{fmt$(b.platform_fee)}</td>
                        <td className="px-4 py-3 text-gray-400">{fmt$(b.coach_payout)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${statusColors[b.status] || 'bg-gray-800 text-gray-400'}`}>
                            {b.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(b.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
