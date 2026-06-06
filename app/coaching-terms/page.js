import Link from 'next/link'

export const metadata = {
  title: 'Coaching Terms — TennisCoach',
  description: 'TennisCoach coaching terms: platform fee, payouts, and how the platform works for coaches.',
}

export default function CoachingTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/for-coaches" className="text-blue-700 text-sm font-medium hover:underline mb-8 inline-block">← Back to coaches page</Link>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Coaching Terms</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-8">

          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Fee</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              TennisCoach charges a <strong>10% platform fee</strong> on each completed session. This is deducted automatically from the session payment — you receive 90% of your listed rate directly to your connected bank account.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The platform fee covers Stripe payment processing, platform maintenance, customer support, and the cost of acquiring new students to your profile.
            </p>
          </section>

          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Founding Coach Period</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Coaches who join during the founding period receive <strong>no platform fee for their first 3 months</strong>. During this period you keep 100% of every session payment.
            </p>
            <p className="text-gray-600 leading-relaxed">
              After the 3-month founding period ends, the standard 10% platform fee applies going forward.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payouts</h2>
            <ul className="space-y-3 text-gray-600 text-sm leading-relaxed">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                Students pay upfront at the time of booking via Stripe.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                Your payout is released within 2 business days of the session being completed and confirmed.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                Payouts are sent directly to your bank account via Stripe Connect. You'll connect your bank during onboarding.
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                No invoicing needed — everything is handled automatically.
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Example Payout</h2>
            <div className="space-y-3">
              {[
                { rate: '$60/hr', duration: '60 min session', gross: '$60.00', fee: '$6.00', payout: '$54.00' },
                { rate: '$80/hr', duration: '90 min session', gross: '$120.00', fee: '$12.00', payout: '$108.00' },
                { rate: '$100/hr', duration: '60 min session', gross: '$100.00', fee: '$10.00', payout: '$90.00' },
              ].map(({ rate, duration, gross, fee, payout }) => (
                <div key={rate + duration} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-800">{rate} · {duration}</p>
                    <p className="text-gray-400 text-xs">Platform fee: {fee}</p>
                  </div>
                  <p className="text-blue-800 font-black text-base">{payout} <span className="text-xs text-gray-400 font-normal">to you</span></p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Founding coaches keep the full gross amount during their first 3 months.</p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile & Listing</h2>
            <p className="text-gray-600 leading-relaxed">
              Creating and maintaining your TennisCoach profile is always free. The platform fee only applies when a session is completed and paid. There are no monthly subscription fees, no listing fees, and no hidden charges.
            </p>
          </section>

        </div>

        <div className="text-center mt-12">
          <Link href="/auth/signup?role=coach"
            className="inline-block bg-blue-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-900 transition">
            List My Profile — It's Free
          </Link>
          <p className="text-gray-400 text-sm mt-3">Questions? Email us at <a href="mailto:hello@serveup.app" className="underline">hello@serveup.app</a></p>
        </div>
      </div>
    </div>
  )
}
