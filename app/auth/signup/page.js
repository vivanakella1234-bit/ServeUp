'use client'
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignupForm() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const [role, setRole] = useState(roleParam || 'student')
  const roleLocked = roleParam === 'coach' || roleParam === 'student'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push(role === 'coach' ? '/onboarding/coach' : '/coaches')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-blue-800">Tennis<span className="text-blue-400">Coach</span></Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
        </div>
        <div className="card p-8">
          {roleLocked ? (
            <div className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 mb-6">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold capitalize">Signing up as a {role}</span>
            </div>
          ) : (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {['student','coach'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${role===r ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500'}`}>
                  I'm a {r}
                </button>
              ))}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required className="input" placeholder="Your full name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input" placeholder="Min. 6 characters" />
            </div>
            <button type="submit" disab