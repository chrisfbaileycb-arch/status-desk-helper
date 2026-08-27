// Follow-up reminder scheduler

const JOBS_STORAGE_KEY = 'echodesk_scheduled_jobs'

function getJobs() {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return []
}

function saveJobs(jobs) {
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs))
  } catch (e) {}
}

export const schedule = {
  async create(config) {
    const jobs = getJobs()
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
    const newJob = {
      id: jobId,
      jobId,
      createdAt: Date.now(),
      ...config,
    }
    jobs.push(newJob)
    saveJobs(jobs)
    console.log('[EchoDesk Scheduler] Created job:', newJob)
    return newJob
  },

  async list() {
    return getJobs()
  },
}
