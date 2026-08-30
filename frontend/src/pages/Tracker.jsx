import { useEffect, useState } from 'react'
import { api, STATUSES } from '../api'

function statusColor(s) {
  const map = {
    NEW: 'bg-slate-100 text-slate-700',
    SHORTLISTED: 'bg-sky-100 text-sky-800',
    APPLIED: 'bg-blue-100 text-blue-800',
    'RECRUITER CONTACTED': 'bg-indigo-100 text-indigo-800',
    'EMPLOYEE CONTACTED': 'bg-violet-100 text-violet-800',
    RESPONSE: 'bg-amber-100 text-amber-800',
    INTERVIEW: 'bg-emerald-100 text-emerald-800',
    OFFER: 'bg-green-100 text-green-800',
    REJECTED: 'bg-rose-100 text-rose-700',
  }
  return map[s] || 'bg-slate-100 text-slate-700'
}

export default function Tracker() {
  const [apps, setApps] = useState([])
  const [jobs, setJobs] = useState({})

  const load = () => {
    api.applications().then(setApps).catch(console.error)
    api.jobs('?limit=500').then((j) => {
      const m = {}
      j.forEach((x) => { m[x.id] = x })
      setJobs(m)
    }).catch(console.error)
  }

  useEffect(() => { load() }, [])

  const update = async (appId, data) => {
    const updated = await api.updateApplication(appId, data)
    setApps((prev) => prev.map((a) => (a.id === appId ? updated : a)))
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Application Tracker</h2>
      {apps.length === 0 ? (
        <p className="text-slate-500">No applications tracked yet. Open a job and click "Start Tracking".</p>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Company / Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Applied</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const job = jobs[a.job_id]
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{job?.company || 'Job'}</div>
                      <div className="text-slate-500 text-xs">{job?.role || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => update(a.id, { status: e.target.value })}
                        className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(a.status)}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {a.applied_date ? new Date(a.applied_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
