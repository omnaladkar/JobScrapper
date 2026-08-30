import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, recColor } from '../api'

const def = { company: '', role: '', location: '', experience: '', description: '', apply_url: '', salary: '' }

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(def)

  const load = () => {
    const params = new URLSearchParams()
    if (filter) params.set('q', filter)
    if (minScore > 0) params.set('min_score', minScore)
    api.jobs(params.toString() ? `?${params}` : '').then(setJobs).catch(console.error)
  }

  useEffect(() => { load() }, [filter, minScore])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.createJob(form)
      setForm(def)
      setShowForm(false)
      load()
    } catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Jobs</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm">
          + Add Job Manually
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid md:grid-cols-2 gap-3">
          <input className="border rounded-md px-3 py-2" placeholder="Company *" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Role *" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Experience (e.g. 2-4 years)" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Apply URL *" required value={form.apply_url} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} />
          <input className="border rounded-md px-3 py-2" placeholder="Salary (e.g. 15 LPA)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          <textarea className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-md md:col-span-2">Save Job</button>
        </form>
      )}

      <div className="flex gap-3 mb-4">
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="Search by role or company..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select className="border rounded-md px-3 py-2" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
          <option value={0}>All matches</option>
          <option value={40}>Score ≥ 40</option>
          <option value={55}>Score ≥ 55</option>
          <option value={80}>Score ≥ 80</option>
        </select>
      </div>

      <div className="space-y-2">
        {jobs.map((j) => (
          <Link key={j.id} to={`/jobs/${j.id}`} className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{j.role}</div>
                <div className="text-sm text-slate-600">{j.company} · {j.location || '—'}</div>
              </div>
              <div className="flex items-center gap-3">
                {j.source === 'manual' && <span className="text-xs text-slate-400">manual</span>}
                {j.match && (
                  <>
                    <span className="text-lg font-bold text-brand-700">{j.match.score}%</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${recColor(j.match.recommendation)}`}>
                      {j.match.recommendation.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
        {jobs.length === 0 && <p className="text-slate-500 py-6 text-center">No jobs match the current filters.</p>}
      </div>
    </div>
  )
}
