const BASE = '/api'

async function request(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || JSON.stringify(data)
    } catch {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  dashboard: () => request('/dashboard'),
  jobs: (params = '') => request(`/jobs${params}`),
  job: (id) => request(`/jobs/${id}`),
  createJob: (data) => request('/jobs', { method: 'POST', body: data }),
  scrape: () => request('/jobs/scrape', { method: 'POST' }),
  seed: () => request('/jobs/seed', { method: 'POST' }),
  jobContacts: (jobId) => request(`/jobs/${jobId}/contacts`, { method: 'POST' }),
  contactsForJob: (jobId) => request(`/contacts/job/${jobId}`),
  addContact: (jobId, data) => request(`/contacts/job/${jobId}`, { method: 'POST', body: data }),
  message: (contactId, role) => request(`/contacts/${contactId}/message`, { method: 'POST', body: { role } }),
  messagesForContact: (contactId) => request(`/contacts/${contactId}/message`),
  sendMessage: (contactId, { role, to = '', subject = '' }) =>
    request(`/contacts/${contactId}/send`, { method: 'POST', body: { role, to, subject } }),
  applications: () => request('/applications'),
  createApplication: (jobId, data) => request(`/applications?job_id=${jobId}`, { method: 'POST', body: data }),
  updateApplication: (appId, data) => request(`/applications/${appId}`, { method: 'PATCH', body: data }),
  applyQueue: (params = '') => request(`/apply/queue${params}`),
  profile: () => request('/profile'),
  updateProfile: (data) => request('/profile', { method: 'PATCH', body: data }),
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${BASE}/profile/resume`, { method: 'POST', body: form }).then((r) => r.json())
  },
  resumes: () => request('/profile/resume'),
}

export function recColor(rec) {
  if (rec === 'APPLY') return 'bg-emerald-100 text-emerald-800'
  if (rec === 'CONSIDER') return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-700'
}

export const STATUSES = [
  'NEW', 'SHORTLISTED', 'APPLIED', 'RECRUITER CONTACTED',
  'EMPLOYEE CONTACTED', 'RESPONSE', 'INTERVIEW', 'OFFER', 'REJECTED',
]
