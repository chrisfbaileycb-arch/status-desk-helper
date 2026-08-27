// Sharing and clipboard utilities

export const share = {
  async copy(text) {
    if (!text) return false
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch (e) {
      console.warn('Clipboard API failed, attempting fallback', e)
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      return successful
    } catch (err) {
      console.error('Copy fallback error:', err)
      return false
    }
  },

  whatsapp(phone, text) {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : ''
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text || '')}`
      : `https://wa.me/?text=${encodeURIComponent(text || '')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  },

  async link({ title, text, url }) {
    const targetUrl = url || window.location.href
    if (navigator?.share) {
      try {
        await navigator.share({
          title: title || 'EchoDesk',
          text: text || '',
          url: targetUrl,
        })
        return true
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error:', err)
        }
      }
    }
    // Fallback to copy
    return this.copy(`${title ? title + '\n\n' : ''}${text || ''}\n${targetUrl}`)
  },
}
