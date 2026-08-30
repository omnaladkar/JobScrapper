import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [resumes, setResumes] = useState([])

  const load = () => {
    api.profile().then(setProfile).catch(console.error)
    api.resumes().then(setResumes).catch(console.error)
  }

  useEffect(() => { load() }, [])

  if (!profile) return <div className="text-slate-500">Loading...</div>

  const save = async () => {
    try {
      const updated = await api.updateProfile({
        name: profile.name,
        target_roles: profile.target_roles,
        skills: profile.skills,
        experience_years: profile.experience_years,
        target_salary_min_lpa: profile.target_salary_min_lpa,
        preferred_locations: profile.preferred_locations,
        company_priorities: profile.company_priorities,
      })
      setProfile(updated)
      alert('Profile saved')
    } catch (e) { alert(e.message) }
  }

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await api.uploadResume(file)
      load()
      alert('Resume uploaded. Re-run the scraper to re-match jobs against it.')
    } catch (err) { alert(err.message) }
  }

  const C = ({ text, textarea, value }) =>
    textarea ? (
      <textarea className="border rounded-md px-3 py-2 w-full" rows={4} value={value}
        onChange={(e) => setProfile({ ...profile, [text]: e.target.value.split('\n').filter((x) => x.trim()) })} />
    ) : (
      <input className="border rounded-md px-3 py-2 w-full" value={value}
        onChange={(e) => setProfile({ ...profile, [text]: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
    )

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-4">Profile & Preferences</h2>

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-sm text-slate-500 mb-1">Name</label>
          <input className="border rounded-md px-3 py-2 w-full" value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm text-slate-500 mb-1">Target Roles (comma-separated)</label>
          <C text="target_roles" value={profile.target_roles.join(', ')} />
        </div>

        <div>
          <label className="block text-sm text-slate-500 mb-1">Skills (comma-separated)</label>
          <C text="skills" value={profile.skills.join(', ')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Experience (years)</label>
            <input type="number" step="0.5" className="border rounded-md px-3 py-2 w-full" value={profile.experience_years}
              onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Min Salary (LPA)</label>
            <input type="number" step="1" className="border rounded-md px-3 py-2 w-full" value={profile.target_salary_min_lpa}
              onChange={(e) => setProfile({ ...profile, target_salary_min_lpa: Number(e.target.value) })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-500 mb-1">Preferred Locations (comma-separated)</label>
          <C text="preferred_locations" value={profile.preferred_locations.join(', ')} />
        </div>

        <div>
          <label className="block text-sm text-slate-500 mb-1">Company Priorities (comma-separated)</label>
          <C text="company_priorities" value={profile.company_priorities.join(', ')} />
        </div>

        <button onClick={save} className="bg-brand-600 text-white px-5 py-2 rounded-md text-sm hover:bg-brand-700">
          Save Profile
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 mt-6">
        <h3 className="font-semibold mb-2">Resume</h3>
        <label className="inline-block bg-slate-800 text-white px-4 py-2 rounded-md text-sm cursor-pointer">
          Upload Resume (PDF)
          <input type="file" accept=".pdf" className="hidden" onChange={upload} />
        </label>

        {resumes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm text-slate-500 mb-2">Recent uploads</h4>
            {resumes.map((r) => (
              <div key={r.id} className="text-sm border-b border-slate-100 py-2">
                <div className="font-semibold">{r.filename}</div>
                <div className="text-slate-500">{r.name} · {r.skills.slice(0, 8).join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
