'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const supabase = createClient()
  const router = useRouter()

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setDropdownOpen(false)
    router.push('/')
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'You'
  const initial = firstName[0]?.toUpperCase() || '?'
  const isCoach = profile?.role === 'coach'
  const dashboardHref = isCoach ? '/dashboard/coach' : '/dashboard/student'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-green-800">
          Serve<span className="text-green-400">Up</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {!user || !isCoach ? (
            <Link href="/coaches" className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">Find a Coach</Link>
          ) : null}
          {!user ? (
            <Link href="/for-coaches" className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">List as Coach</Link>
          ) : null}

          {user ? (
            <div className="flex items-center gap-3">
              {/* My Dashboard link */}
              <Link href={dashboardHref}
                className="text-sm font-semibold text-green-800 hover:text-green-700 transition-colors">
                My Dashboard
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-full pl-1 pr-3 py-1 hover:bg-green-100 transition-colors"
                >
                  {/* Initial circle */}
                  <div className="w-7 h-7 rounded-full bg-green-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {initial}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{firstName}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isCoach ? 'bg-green-200 text-green-800' : 'bg-blue-100 text-blue-700'}`}>
                    {isCoach ? 'Coach' : 'Student'}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-800">{profile?.full_name || firstName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Link href={dashboardHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      My Dashboard
                    </Link>
                    {!isCoach && (
                      <Link href="/coaches"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Find a Coach
                      </Link>
                    )}
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-600 hover:text-green-800 font-medium text-sm">Sign In</Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
          {user ? (
            <>
              {/* Mobile logged-in header */}
              <div className="flex items-center gap-3 py-2 border-b border-gray-100 mb-1">
                <div className="w-9 h-9 rounded-full bg-green-700 text-white font-black flex items-center justify-center flex-shrink-0">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{profile?.full_name || firstName}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCoach ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {isCoach ? 'Coach' : 'Student'}
                  </span>
                </div>
              </div>
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-gray-700 font-semibold text-sm py-2">My Dashboard</Link>
              {!isCoach && <Link href="/coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">Find a Coach</Link>}
              <button onClick={() => { setMenuOpen(false); handleSignOut() }}
                className="text-sm font-semibold text-red-600 text-left py-2 border-t border-gray-100 mt-1">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">Find a Coach</Link>
              <Link href="/for-coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">List as Coach</Link>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-3 text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
