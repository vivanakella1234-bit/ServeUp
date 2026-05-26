import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-600 flex flex-col items-center justify-center text-center px-6 pt-16">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          🎾 Early Access — Free to Join
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight max-w-4xl mb-6" style={{letterSpacing:'-2px'}}>
          Your next coach is already in <span className="text-green-400">your city.</span>
        </h1>
        <p className="text-white/75 text-lg md:text-xl max-w-xl mb-10">
          ServeUp connects serious tennis players with verified private coaches — wherever you are. No more losing weeks of training time to a city change.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/coaches" className="bg-white text-green-800 font-bold px-8 py-4 rounded-xl hover:shadow-xl transition-all hover:-translate-y-0.5">
            Find a Coach Near Me
          </Link>
          <Link href="/auth/signup?role=coach" className="border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl hover:border-white hover:bg-white/10 transition-all">
            I'm a Coach — List My Services
          </Link>
        </div>
        <div className="flex gap-12 mt-16">
          {[['UTR','Verified Coaches'],['15%','Commission Only'],['Any City','Globally']].map(([num,label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-black text-white">{num}</div>
              <div className="text-xs text-white/60 uppercase tracking-wide mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-4xl font-black text-gray-900">Simple on both sides.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['🔍','Search your city','Enter your city or zip. Filter by price, UTR level, specialty, and whether the coach travels to you.'],
              ['📅','Book in seconds','See live availability, pick a time, confirm the location, and pay — all in one flow.'],
              ['🎾','Show up and play','Get a confirmation with all details. Coach gets paid automatically after your session.'],
            ].map(([icon,title,desc]) => (
              <div key={title} className="card p-8">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 px-6 bg-green-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-3">Trust & credentials</p>
            <h2 className="text-4xl font-black text-white">Every coach is verified.</h2>
            <p className="text-white/70 mt-4 max-w-xl mx-auto">The only coaching platform built around real, verifiable tennis credentials.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['UTR Verified','Coaches list their Universal Tennis Rating — the global standard. We verify it.'],
              ['College & Pro Background','D-I, D-II, ATP/WTA history displayed clearly on every profile.'],
              ['Verified Reviews','Reviews only from students who completed a paid session. No fake ratings.'],
              ['Coach-set Rates','Every coach sets their own rate. ServeUp takes 15% — nothing hidden.'],
              ['USTA Certifications','PTR, USPTA certifications displayed alongside playing credentials.'],
              ['Travel Flexibility','Coaches can opt in to traveling to your court.'],
            ].map(([title,desc]) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-green-400 font-bold text-sm uppercase tracking-wide mb-2">{title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to find your coach?</h2>
          <p className="text-gray-500 mb-8">Join thousands of players who never lose training time to a city change again.</p>
          <Link href="/coaches" className="btn-primary text-base">Browse Coaches →</Link>
        </div>
      </section>
    </div>
  )
}
