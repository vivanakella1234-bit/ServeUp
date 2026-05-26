export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key here so we can write bookings server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      coachId, studentId, coachName, studentEmail,
      startTime, endTime, durationMins, locationAddress,
      totalAmount, platformFee, coachPayout, notes
    } = body

    // 1. Create a pending booking in Supabase
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        coach_id: coachId,
        student_id: studentId,
        session_type: 'in-person',
        duration_mins: durationMins,
        start_time: startTime,
        end_time: endTime,
        location_address: locationAddress,
        status: 'pending_payment',
        total_amount: totalAmount,
        platform_fee: platformFee,
        coach_payout: coachPayout,
        notes: notes || null,
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 })
    }

    const sessionDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    const sessionTime = new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    })

    // 2. Create a Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: studentEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tennis Session with ${coachName}`,
              description: `${durationMins} min session · ${sessionDate} at ${sessionTime}${locationAddress ? ` · ${locationAddress}` : ''}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        coachId,
        studentId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/success?booking_id=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${coachId}?cancelled=true`,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
