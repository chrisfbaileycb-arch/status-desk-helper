// App gate unlock helper

export function clearGateToken() {
  localStorage.removeItem('echodesk_gate_token')
}

export function gateSeedIsOpen() {
  return true
}

export function setGateSeed() {}

export function handleGatedResponse() {}

export function popMagicKey() {
  return null
}

export async function fetchGateStatus() {
  return { locked: false, unlocked: true }
}

export async function submitGateCode(code) {
  if (code) {
    localStorage.setItem('echodesk_gate_token', code)
    return { ok: true }
  }
  return { ok: false }
}
