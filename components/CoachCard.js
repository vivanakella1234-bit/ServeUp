import Link from 'next/link'

export default function CoachCard({ coach }) {
  const stars = '★'.repeat(Math.round(coach.rating_avg || 0)) + '☆'.repeat(5 - Math.round(coach.rating_avg || 0))
  return (
    <Link href={`/coaches/${coach.id}`}>
      <div className="card p-5 cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl flex-shrink-0">
            {coach.profiles?.full_name?.[0] || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-800 transition-colors">
                {coach.profiles?.full_name}
              </h3>
              <span className="text-blue-800 font-bold text-lg whitespace-nowrap">${coach.hourly_rate}<span className="text-gray-400 font-normal text-sm">/hr</span></span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{coach.city}{coach.state ? `, ${coach.state}` : ''}</p>
            {coach.primary_venue && <p className="text-xs text-gray-400 mt-0.5">📍 {coach.primary_venue}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {coach.utr_rating && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                  UTR {coach.utr_rating}
                </span>
              )}
              {coach.travels_to_student && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Travels to you</span>
              )}
              {coach.rating_avg > 0 && (
                <span className="text-xs text-amber-500">{stars} <span className="text-gray-400">({coach.review_count})</span></span>
              )}
            </div>
            {coach.specialties?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {coach.specialties.slice(0,3).map(s => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
