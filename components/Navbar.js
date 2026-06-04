'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-green-800">
          Serve<span className="text-green-400">Up</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/coaches" className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">Find a Coach</Link>
          <Link href="/for-coaches" className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">List as Coach</Link>
          {user ? (
            <>
              <Link href={profile?.role === 'coach' ? '/dashboard/coach' : '/dashboard/student'}
                className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">
                Dashboard
              </Link>
              <button onClick={handleSignOut}
                className="text-sm font-semibold text-green-800 border-2 border-green-800 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors">
                Sign Out
              </button>
            </>
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
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          <Link href="/coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">Find a Coach</Link>
          <Link href="/for-coaches" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">List as Coach</Link>
          {user ? (
            <>
              <Link href={profile?.role === 'coach' ? '/dashboard/coach' : '/dashboard/student'}
                onClick={() => setMenuOpen(false)}
                className="text-gray-700 font-medium text-sm py-2">
                Dashboard
              </Link>
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className="text-sm font-semibold text-green-800 border-2 border-green-800 px-4 py-2 rounded-xl text-left">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-gray-700 font-medium text-sm py-2">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-3 text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
