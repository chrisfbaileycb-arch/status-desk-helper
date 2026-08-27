// User identity helpers

export function getAppUserId() {
  return 'user_founder_1'
}

export function getAnonymousId() {
  let anon = localStorage.getItem('echodesk_anon_id')
  if (!anon) {
    anon = 'anon_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('echodesk_anon_id', anon)
  }
  return anon
}
