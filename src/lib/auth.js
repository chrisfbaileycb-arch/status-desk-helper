// Client-side authentication manager with localStorage persistence

const STORAGE_KEY = 'echodesk_auth_user'

const DEFAULT_USER = {
  id: 'user_founder_1',
  email: 'founder@echodesk.app',
  name: 'Chris Bailey',
  role: 'owner',
}

const listeners = new Set()

function getSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse auth user', e)
  }
  // Default to pre-authenticated user for immediate smooth onboarding
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER))
  return DEFAULT_USER
}

let currentUser = typeof window !== 'undefined' ? getSavedUser() : DEFAULT_USER

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(currentUser)
    } catch (e) {
      console.error(e)
    }
  })
}

export const auth = {
  getCurrentUser() {
    return currentUser
  },

  onAuthChange(callback) {
    listeners.add(callback)
    // Fire immediately with current value
    callback(currentUser)
    return () => {
      listeners.delete(callback)
    }
  },

  signIn(user = DEFAULT_USER) {
    currentUser = user
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
    } catch (e) {}
    notifyListeners()
    return currentUser
  },

  signOut() {
    currentUser = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
    notifyListeners()
  },

  isAppOwner() {
    return true
  },
}

export const adoptSession = async () => {
  return auth.getCurrentUser()
}
