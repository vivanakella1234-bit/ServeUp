import Link from 'next/link'

export const metadata = {
  title: 'List Your Tennis Coaching Profile — TennisCoach',
  description: 'Join TennisCoach as a founding coach. No platform fee for your first 3 months. Students find you by UTR, book and pay instantly. Setup takes 5 minutes.',
  openGraph: {
    title: 'List Your Tennis Coaching Profile — TennisCoach',
    description: 'No platform fee for founding coaches. Students book and pay directly on your profile. Setup takes 5 minutes.',
    url: 'https://serveup-puce.vercel.app/for-coaches',
    siteName: 'TennisCoach',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List Your Tennis Coaching Profile — TennisCoach',
    description: 'No platform fee for founding coaches. Students book and pay directly on your profile.',
  },
}

const faqs = [
  {
    q: 'Is it really free to list my profile?',
    a: 'Yes. Creating and maintaining your profile on TennisCoach is always free. TennisCoach only earns when you earn — a small platform fee applies per completed session after your founding period ends. For your first 3 months as a founding coach: no fee at all. Full details are in our Coaching Terms.',
  },
  {
    q: 'How do I get paid?',
    a: 'Students pay upfront when they book. After the session is completed, your payout is released automatically within 2 business days via Stripe. During your founding period you keep 100% of your rate.',
  },
  {
    q: 'Can I set my own rate?',
    a: '100%. You decide your hourly rate. TennisCoach never dictates pricing. If you charge $80/hr, students pay $80/hr. No surprise markups.',
  },
  {
    q: 'Do I need a fixed court or venue?',
    a: 'No. City is all that\'s required. You can optionally list a home court or club, and turn on a "travels to student\'s court" option for added flexibility.',
  },
  {
    q: 'What credentials do I need?',
    a: 'Your UTR rating is the primary trust signal on TennisCoach — it lets students see your actual playing background. USPTA/PTR certifications, college level, and pro ranking are all optional add-ons.',
  },
  {
    q: 'What happens after my 3-month founding period?',
    a: 'A small platform fee applies per completed session — covering Stripe payment processing, platform maintenance, and customer support. You can continue using TennisCoach as long as you\'d like. See our Coaching Terms for details.',
  },
]

export default function ForCoachesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 pt-28 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
            🎾 Founding Coach Offer — Limited Spots
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6" style={{letterSpacing: '-1.5px'}}>
            Get found. Get booked.<br />
            <span className="text-blue-400">Keep more of what you earn.</span>
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            TennisCoach puts your profile in front of students searching by city, UTR level, and specialty. They book you, pay upfront, and you get paid automatically — no invoicing, no chasing.
          </p>
          <Link
            href="/auth/signup?role=coach"
            className="inline-block bg-white text-blue-800 font-black text-lg px-10 py-4 rounded-xl hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            List My Profile — It's Free
          </Link>
          <p className="text-white/50 text-sm mt-4">Setup takes 5 minutes. No credit card needed.</p>
        </div>
      </section>

      {/* Founding offer banner */}
      <section className="bg-blue-600 py-5 px-6 text-center">
        <p className="text-white font-bold text-base md:text-lg">
          🎉 Founding coaches pay <span className="bg-white text-blue-700 px-2 py-0.5 rounded font-black">no platform fee</span> for their first 3 months.
        </p>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">How it works for coaches</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Live on TennisCoach in 5 minutes.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '👤', title: 'Create your profile', desc: 'Add your UTR, bio, rate, city, and specialties. Optionally add USTA certs, college background, and a travel toggle.' },
              { step: '2', icon: '🔍', title: 'Students find you', desc: 'Students in your city search by UTR level, rate range, and specialty. Your profile shows up exactly where it should.' },
              { step: '3', icon: '📅', title: 'They book & pay', desc: 'Students pick a session length and time, then pay by card. You get an email confirmation with all details.' },
              { step: '4', icon: '💸', title: 'You get paid', desc: 'After the session, your payout hits your bank account within 2 business days. Automatic — no invoicing.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-black text-sm mb-4">{step}</div>
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
                {step !== '4' && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 font-bold z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings calculator */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">What you earn</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Your rate. Your schedule.</h2>
          <p className="text-gray-500 mb-12 max-w-xl mx-auto">You set your hourly rate. Here's what your monthly earnings look like — founding coaches keep 100% for their first 3 months.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { rate: '$60', sessions: 10, payout: '$540', label: 'Part-time (10 sessions/mo)' },
              { rate: '$80', sessions: 20, payout: '$1,440', label: 'Active coach (20 sessions/mo)' },
              { rate: '$120', sessions: 30, payout: '$3,240', label: 'Full-time (30 sessions/mo)' },
            ].map(({ rate, sessions, payout, label }) => (
              <div key={label} className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <p className="text-3xl font-black text-blue-800">{rate}<span className="text-base font-normal text-gray-500">/hr</span></p>
                <p className="text-sm text-gray-500 mt-1">{sessions} sessions/mo</p>
                <div className="border-t border-blue-200 my-4"></div>
                <p className="text-2xl font-black text-gray-900">{payout}</p>
                <p className="text-xs text-gray-400 mt-1">monthly payout</p>
                <p className="text-xs text-blue-600 font-semibold mt-2">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-6">Founding coaches keep 100% during their first 3 months — no platform fee.</p>
        </div>
      </section>

      {/* Why TennisCoach */}
      <section className="py-20 px-6 bg-blue-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">Why TennisCoach</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Built for coaches who are serious about their craft.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'UTR-first discovery', desc: 'Students search by your UTR rating — not just keywords. Your real playing background is your credential.' },
              { icon: '💳', title: 'No more cash awkwardness', desc: 'Students pay upfront by card. The Venmo-after-session conversation is gone forever.' },
              { icon: '📍', title: 'In-person & online', desc: 'Offer in-person sessions, online coaching, or toggle on "travels to student\'s court" — your call.' },
              { icon: '⭐', title: 'Verified reviews', desc: 'Only students who completed a paid session can leave a review. Real social proof, no fake ratings.' },
              { icon: '🔒', title: 'You control your availability', desc: 'No forced schedule. Students request sessions and you confirm. Nothing gets booked without your approval.' },
              { icon: '🚀', title: 'You\'re early', desc: 'Founding coaches get top placement as the platform grows — and no platform fee for 3 months while the student base builds.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Common questions</p>
            <h2 className="text-3xl font-black text-gray-900">Straight answers.</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border border-gray-100 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Full payout and fee details in our{' '}
            <Link href="/coaching-terms" className="text-blue-700 font-semibold hover:underline">Coaching Terms</Link>.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-blue-800 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to get your first TennisCoach booking?</h2>
          <p className="text-white/70 mb-8 text-lg">Profile setup takes 5 minutes. Founding coaches pay no platform fee for 3 months.</p>
          <Link
            href="/auth/signup?role=coach"
            className="inline-block bg-white text-blue-800 font-black px-8 py-4 rounded-xl hover:bg-blue-50 transition text-lg">
            List My Profile — It's Free
          </Link>
        </div>
      </section>
    </div>
  )
}