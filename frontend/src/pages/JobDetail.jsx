import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, recColor, STATUSES } from '../api'

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState({})
  const [app, setApp] = useState(null)

  const load = () => {
    api.job(id).then(setJob).catch(console.error)
    api.contactsForJob(id).then(setContacts).catch(console.error)
    api.applications().then((apps) => {
      const found = apps.find((a) => String(a.job_id) === String(id))
      if (found) setApp(found)
    }).catch(console.error)
  }

  useEffect(() => { load() }, [id])

  const seedContacts = async () => {
    const c = await api.jobContacts(id)
    setContacts(c)
  }

  const generateMsg = async (contactId, role) => {
    const m = await api.message(contactId, role)
    setMessages((prev) => ({ ...prev, [`${contactId}:${role}`]: m.body }))
  }

  const startApp = async () => {
    try {
      const a = await api.createApplication(id, { status: 'NEW' })
      setApp(a)
    } catch (e) { alert(e.message) }
  }

  const updateStatus = async (status) => {
    if (!app) return
    const updated = await api.updateApplication(app.id, { status })
    setApp(updated)
  }

  if (!job) return <div className="text-slate-500">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/jobs" className="text-brand-600 text-sm">← Back</Link>
        <h2 className="text-xl font-bold">{job.role}</h2>
        {job.match && (
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${recColor(job.match.recommendation)}`}>
            {job.match.recommendation.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-slate-600 text-sm">{job.company} · {job.location || '—'} · {job.source}</div>
            {job.salary && <div className="text-sm mt-1">💰 {job.salary}</div>}
            <a href={job.apply_url} target="_blank" rel="noreferrer" className="text-brand-600 text-sm underline mt-2 inline-block">
              Open Job Posting →
            </a>
            {job.description && (
              <div className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">{job.description}</div>
            )}
          </div>

          {job.match && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-brand-700">{job.match.score}%</span>
                <span className="text-slate-500">Match</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm mb-4">
                {[
                  ['Role', job.match.role_score],
                  ['Skills', job.match.skills_score],
                  ['Experience', job.match.experience_score],
                  ['Location', job.match.location_score],
                  ['Company', job.match.company_score],
                  ['Salary', job.match.salary_score],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-50 rounded p-2">
                    <div className="text-slate-500 text-xs">{label}</div>
                    <div className="font-semibold">{val}%</div>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">Why this is a good match</div>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {job.match.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
                {job.match.missing_skills.length > 0 && (
                  <>
                    <div className="font-semibold mt-3 mb-1">Missing</div>
                    <ul className="list-disc pl-5 text-slate-700">{job.match.missing_skills.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Application</h3>
              {!app && <button onClick={startApp} className="bg-brand-600 text-white px-4 py-1.5 rounded-md text-sm">Start Tracking</button>}
            </div>
            {app ? (
              <div>
                <label className="text-sm text-slate-500">Status</label>
                <select value={app.status} onChange={(e) => updateStatus(e.target.value)} className="border rounded-md px-3 py-2 w-full mt-1">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not tracking this job yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 h-fit">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">People</h3>
            <button onClick={seedContacts} className="text-brand-600 text-xs underline">Seed contacts</button>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts yet. Click "Seed contacts" to check / prepare people to contact.</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.contact_type === 'recruiter' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>
                      {c.contact_type}
                    </span>
                    {c.confidence > 0 ? (
                      <span className="text-xs text-slate-500">conf {c.confidence}</span>
                    ) : (
                      <span className="text-xs text-rose-500">UNVERIFIED</span>
                    )}
                  </div>
                  <div className="font-semibold mt-2">{c.name}</div>
                  <div className="text-sm text-slate-600">{c.role}</div>
                  {c.reason && <div className="text-xs text-slate-400 mt-1">{c.reason}</div>}
                  {c.profile_url && <a href={c.profile_url} target="_blank" rel="noreferrer" className="text-brand-600 text-xs underline mt-1 inline-block">Open LinkedIn Profile</a>}
                  <button
                    onClick={() => generateMsg(c.id, c.contact_type === 'recruiter' ? 'recruiter' : 'referral')}
                    className="mt-2 bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs"
                  >
                    Generate Message
                  </button>
                  {messages[`${c.id}:${c.contact_type === 'recruiter' ? 'recruiter' : 'referral'}`] && (
                    <div className="mt-2">
                      <pre className="bg-slate-50 border border-slate-200 rounded p-2 text-xs whitespace-pre-wrap">{messages[`${c.id}:${c.contact_type === 'recruiter' ? 'recruiter' : 'referral'}`]}</pre>
                      <button onClick={() => navigator.clipboard.writeText(messages[`${c.id}:${c.contact_type === 'recruiter' ? 'recruiter' : 'referral'}`])} className="text-brand-600 text-xs underline mt-1">Copy Message</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
