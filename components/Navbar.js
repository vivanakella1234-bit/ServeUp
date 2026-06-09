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
        <Link href="/" className="text-2xl font-black text-blue-800">
          Tennis<span className="text-blue-400">Coach</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {!user || !isCoach ? (
            <Link href="/coaches" className="text-gray-600 hover:text-blue-800 font-medium text-sm transition-colors">Find a Coach</Link>
          ) : null}
          {!user ? (
            <Link href="/for-coaches" className="text-gray-600 hover:text-blue-800 font-medium text-sm transition-colors">List as Coach</Link>
          ) : null}

          {user ? (
            <div className="flex items-center gap-3">
              {/* My Dashboard link */}
              <Link href={dashboardHref}
                className="text-sm font-semibold text-blue-800 hover:text-blue-700 transition-colors">
                My Dashboard
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-full pl-1 pr-3 py-1 hover:bg-blue-100 transition-colors"
                >
                  {/* Initial circle */}
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {initial}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{firstName}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isCoach ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700'}`}>
                    {isCoach ? 'Coach' : 'Student'}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-gray-900">{profile?.full_name || firstName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link href={dashboardHref} onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      My Dashboard
                    </Link>
                    {!isCoach && (
                      <Link href="/coaches" onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Find a Coach
                      </Link>
                    )}
                    <button onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-blue-800 transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <div className={`w-5 h-0.5 bg-gray-700 mb-1.5 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-5 h-0.5 bg-gray-700 mb-1.5 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4">
          {user && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{firstName}</p>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isCoach ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700'}`}>
                  {isCoach ? 'Coach' : 'Student'}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Link href="/coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2.5">Find a Coach</Link>
            {!user && <Link href="/for-coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2.5">List as Coach</Link>}
            {user ? (
              <>
                <Link href={dashboardHref} onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2.5">My Dashboard</Link>
                <button onClick={handleSignOut} className="text-red-600 font-medium text-sm py-2.5 text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2.5">Sign In</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-sm mt-2">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
                    <div className="px-4 py-2 bord