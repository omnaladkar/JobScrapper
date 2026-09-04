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
  const [queue, setQueue] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => api.dashboard().then(setData).catch(console.error)
  const loadQueue = () => api.applyQueue().then(setQueue).catch(console.error)
  useEffect(() => {
    load()
    loadQueue()
  }, [])

  if (!data) return <div className="text-slate-500">Loading...</div>
  const s = data.stats

  const statList = [
    ['Jobs Found', s.jobs_found],
    ['High Matches', s.high_matches],
    ['Ready to Apply', s.ready_to_apply],
    ['Applications', s.applications],
    ['People to Contact', s.people_to_contact],
    ['Responses', s.responses],
    ['Interviews', s.interviews],
    ['Offers', s.offers],
  ]

  const openApply = (q) => {
    setBusyId(q.job_id)
    window.open(q.apply_url, '_blank', 'noopener,noreferrer')
    setTimeout(() => {
      setBusyId(null)
      load()
      loadQueue()
    }, 1500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My Job Search</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { loadQueue(); load() }}
            className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm hover:bg-brand-700"
          >
            ↻ Refresh
          </button>
          <button
            onClick={async () => {
              try {
                await api.scrape()
                alert('Scrape complete. Refresh to see new jobs.')
                load()
              } catch (e) { alert(e.message) }
            }}
            className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700"
          >
            ↻ Run Scraper
          </button>
          <button
            onClick={async () => {
              try {
                const r = await api.seed()
                alert(`Seeded ${r.new_jobs} new jobs (${r.total_jobs} total).`)
                load()
              } catch (e) { alert(e.message) }
            }}
            className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700"
          >
            Seed Jobs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statList.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">🚀 Ready to Apply Today</h3>
        {queue && <span className="text-xs text-slate-500">{queue.total} queued · opens on the company site</span>}
      </div>
      {!queue ? (
        <p className="text-slate-500 mb-6">Loading queue...</p>
      ) : queue.items.length === 0 ? (
        <p className="text-slate-500 mb-6">
          Queue empty. Run the scraper or raise match scores; anything you've applied to is excluded.
        </p>
      ) : (
        <div className="space-y-3 mb-8">
          {queue.items.map((q) => (
            <div key={q.job_id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{q.company}</div>
                  <div className="text-sm text-slate-600">{q.role}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {q.location}{q.location && q.salary ? ' · ' : ''}{q.salary}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-brand-700">{q.score}%</span>
                  <a
                    href={q.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => openApply(q)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-block ${
                      q.can_apply
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-400 pointer-events-none'
                    }`}
                  >
                    Apply ↗
                  </a>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Opens the application on {new URL(q.apply_url).hostname.replace('www.', '')}{' '}
                so you can submit there.
              </div>
            </div>
          ))}
        </div>
      )}

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