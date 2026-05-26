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
        <div className="hidden md:flex items-center gap-6">
          <Link href="/coaches" className="text-gray-600 hover:text-green-800 font-medium text-sm transition-colors">Find a Coach</Link>
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
      </div>
    </nav>
  )
}
