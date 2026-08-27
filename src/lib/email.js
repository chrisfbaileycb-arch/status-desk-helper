// Client-side email dispatch integration

export const email = {
  async send({ to, subject, body }) {
    if (!to) {
      throw new Error('Recipient email address is required')
    }
    // Simulate sending email
    await new Promise((r) => setTimeout(r, 400))
    console.log(`[EchoDesk Email] Sent to: ${to}, Subject: ${subject}\n\n${body}`)
    return { sent: true }
  },
}
