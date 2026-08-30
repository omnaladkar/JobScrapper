import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, recColor } from '../api'

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-2xl font-bold text-brand-700">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  const load = () => api.dashboard().then(setData).catch(console.error)
  useEffect(() => { load() }, [])

  if (!data) return <div className="text-slate-500">Loading...</div>
  const s = data.stats

  const statList = [
    ['Jobs Found', s.jobs_found],
    ['High Matches', s.high_matches],
    ['Applications', s.applications],
    ['People to Contact', s.people_to_contact],
    ['Responses', s.responses],
    ['Interviews', s.interviews],
    ['Offers', s.offers],
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My Job Search</h2>
        <button
          onClick={async () => {
            try {
              await api.scrape()
              alert('Scrape complete. Refresh to see new jobs.')
              load()
            } catch (e) { alert(e.message) }
          }}
          className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm hover:bg-brand-700"
        >
          ↻ Run Scraper
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statList.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
      </div>

      <h3 className="text-lg font-semibold mb-3">🔥 Top Jobs</h3>
      {data.top_jobs.length === 0 ? (
        <p className="text-slate-500">No jobs yet. Run the scraper or add jobs manually.</p>
      ) : (
        <div className="space-y-2">
          {data.top_jobs.map((j, i) => (
            <Link
              key={j.id}
              to={`/jobs/${j.id}`}
              className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-600 hover:shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{j.company}</div>
                  <div className="text-sm text-slate-600">{j.role}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-brand-700">{j.score}%</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${recColor(j.recommendation)}`}>
                    {j.recommendation.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
