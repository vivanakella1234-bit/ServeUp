'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BookingSuccess() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!bookingId) { setLoading(false); return }
    async function fetchBooking() {
      // Poll briefly — webhook may take a second to confirm
      let attempts = 0
      while (attempts < 5) {
        const { data } = await supabase
          .from('bookings')
          .select('*, coach:coach_profiles(hourly_rate, primary_venue, profiles(full_name))')
          .eq('id', bookingId)
          .single()

        if (data && data.status === 'confirmed') {
          setBooking(data)
          setLoading(false)
          return
        }
        attempts++
        await new Promise(r => setTimeout(r, 1200))
      }
      // If still not confirmed, show generic success (webhook may be slightly delayed)
      setLoading(false)
    }
    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  const sessionDate = booking
    ? new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const sessionTime = booking
    ? new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-md text-center">
        {/* Big checkmark */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">You're booked!</h1>
        <p className="text-gray-500 mb-8">Payment confirmed. A confirmation email is on its way to you.</p>

        {booking && (
          <div className="card p-6 text-left mb-6">
            <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Session Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coach</span>
                <span className="font-semibold">{booking.coach?.profiles?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold">{sessionDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-semibold">{sessionTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold">{booking.duration_mins} minutes</span>
              </div>
              {booking.location_address && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-right max-w-[200px]">{booking.location_address}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-green-800">
                <span>Total paid</span>
                <span>${(booking.total_amount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/dashboard/student" className="btn-primary text-center">
            Go to My Dashboard
          </Link>
          <Link href="/coaches" className="text-green-700 text-sm font-medium hover:underline">
            Browse more coaches
          </Link>
        </div>
      </div>
    </div>
  )
}
