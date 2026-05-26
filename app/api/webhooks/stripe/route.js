export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.bookingId

    if (!bookingId) {
      return NextResponse.json({ error: 'No bookingId in metadata' }, { status: 400 })
    }

    // 1. Update booking status to confirmed
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', stripe_payment_id: session.payment_intent })
      .eq('id', bookingId)
      .select(`
        *,
        coach:coach_profiles(
          hourly_rate,
          primary_venue,
          profiles(full_name, email)
        ),
        student:student_profiles(
          profiles(full_name, email)
        )
      `)
      .single()

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 2. Send confirmation emails
    const sessionDate = new Date(booking.start_time).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    const sessionTime = new Date(booking.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit'
    })
    const totalFormatted = `$${(booking.total_amount / 100).toFixed(2)}`
    const coachPayoutFormatted = `$${(booking.coach_payout / 100).toFixed(2)}`

    const studentName = booking.student?.profiles?.full_name || 'Student'
    const studentEmail = booking.student?.profiles?.email || session.customer_email
    const coachName = booking.coach?.profiles?.full_name || 'Coach'
    const coachEmail = booking.coach?.profiles?.email
    const locationText = booking.location_address || 'TBD'

    // Email to student
    if (studentEmail) {
      await resend.emails.send({
        from: 'ServeUp <bookings@serveup.app>',
        to: studentEmail,
        subject: `Your session with ${coachName} is confirmed!`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="background: #14532d; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Serve<span style="color: #4ade80;">Up</span></h1>
            </div>
            <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
              <h2 style="margin-top: 0;">You're booked, ${studentName}! 🎾</h2>
              <p style="color: #6b7280;">Here are your session details:</p>

              <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Coach</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${coachName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${sessionDate}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${sessionTime}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Duration</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.duration_mins} minutes</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${locationText}</td></tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0 0; color: #14532d; font-weight: 700;">Amount paid</td>
                    <td style="padding: 12px 0 0; color: #14532d; font-weight: 700; text-align: right;">${totalFormatted}</td>
                  </tr>
                </table>
              </div>

              ${booking.notes ? `<p style="color: #6b7280; font-size: 14px;">Your notes: <em>${booking.notes}</em></p>` : ''}

              <p style="color: #6b7280; font-size: 14px;">See you on the court! After your session, you can leave a review from your student dashboard.</p>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/student"
                 style="display: inline-block; background: #14532d; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                View My Dashboard
              </a>
            </div>
          </div>
        `
      })
    }

    // Email to coach
    if (coachEmail) {
      await resend.emails.send({
        from: 'ServeUp <bookings@serveup.app>',
        to: coachEmail,
        subject: `New booking from ${studentName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="background: #14532d; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Serve<span style="color: #4ade80;">Up</span></h1>
            </div>
            <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
              <h2 style="margin-top: 0;">New session booked, ${coachName}! 🎾</h2>
              <p style="color: #6b7280;">${studentName} just paid and confirmed a session with you.</p>

              <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Student</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${studentName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${sessionDate}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${sessionTime}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Duration</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${booking.duration_mins} minutes</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td><td style="padding: 8px 0; font-weight: 600; text-align: right;">${locationText}</td></tr>
                  ${booking.notes ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Student notes</td><td style="padding: 8px 0; font-style: italic; text-align: right; font-size: 13px;">${booking.notes}</td></tr>` : ''}
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0 0; color: #14532d; font-weight: 700;">Your payout</td>
                    <td style="padding: 12px 0 0; color: #14532d; font-weight: 700; text-align: right;">${coachPayoutFormatted}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #6b7280; font-size: 13px;">Payout is processed within 2 business days of the session date.</p>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/coach"
                 style="display: inline-block; background: #14532d; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                View My Dashboard
              </a>
            </div>
          </div>
        `
      })
    }
  }

  return NextResponse.json({ received: true })
}
