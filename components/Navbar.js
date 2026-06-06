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
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 bord