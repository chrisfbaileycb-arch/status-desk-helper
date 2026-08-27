// Curated playbook knowledge repository and search engine

const PLAYBOOKS = [
  {
    id: 'twilio-setup',
    title: 'Twilio Numbers & Webhooks Setup Playbook',
    tags: ['twilio', 'phone', 'sms', 'voice', 'webhook', 'setup', 'infrastructure'],
    text: `Twilio Setup Blueprint for Solo SaaS Builders:
1. Number Acquisition: Navigate to Phone Numbers > Manage > Buy a Number. Ensure both SMS and Voice capabilities are checked. Match the local area code of your client's target market.
2. A2P 10DLC Registration (Mandatory for US SMS): Under Messaging > Trust Hub, register a Brand (Sole Prop or Standard) and Campaign. In the opt-in description, specify exact proof of consent (e.g., 'Customer enters mobile number in booking form or provides verbal consent at front desk').
3. Webhook Wiring: In Active Numbers > Phone Number details:
   - For incoming SMS: Set 'A Message Comes In' to Webhook (HTTP POST) with your app's endpoint.
   - For incoming Voice: Set 'A Call Comes In' to Webhook (HTTP POST) or TwiML Bin.
4. Resilience & Billing: Under Billing > Preferences, enable Auto-Recharge with a minimum $10 balance trigger and $20 recharge amount to prevent outages during high-volume spikes.`,
  },
  {
    id: 'prelaunch-checklist',
    title: 'Universal SaaS Pre-Launch & Deployment Checklist',
    tags: ['deploy', 'launch', 'checklist', 'production', 'domain', 'stripe', 'billing'],
    text: `Pre-Launch Deployment Checklist:
1. Custom Domain & DNS: Connect apex and www records with CNAME/A records and verify SSL certificate generation.
2. Stripe Live Mode Verification: Switch Stripe from test to live API keys. Create a $1 live test transaction to verify checkout webhooks, receipt delivery, and subscription provisioning.
3. Smoke Test: Test the primary user workflow on both mobile Safari/Chrome and desktop.
4. Error Monitoring: Set up a webhook or Sentry alert for uncaught exceptions.
5. Legal Essentials: Ensure Terms of Service, Privacy Policy, and SMS opt-out (reply STOP to cancel) disclaimers are linked in the footer.`,
  },
  {
    id: 'cold-outreach-playbook',
    title: 'High-Converting Cold Outreach for Niche SaaS',
    tags: ['cold', 'email', 'outreach', 'sales', 'script', 'prospecting', 'dm'],
    text: `Cold Outreach Rules for Solo Founders:
1. Rule of 120 Words: Keep initial outreach under 120 words. No long background stories or feature dumps.
2. Problem-Led Hook: Reference a specific friction point observed in their business (e.g., 'Noticed your front desk handles 40+ phone calls during peak hours while managing seated guests').
3. The Low-Friction Offer: Never ask for a 30-minute demo. Ask for a 5-minute look: 'Would you be open to a 5-minute video walkthrough showing how other restaurants handle this?'
4. Follow-Up Cadence: 3 touches over 8 business days (Day 1: Initial Hook, Day 4: Specific Result/Proof, Day 8: Graceful Breakaway with value snippet).`,
  },
  {
    id: 'objection-handling',
    title: 'Objection Handling Playbook',
    tags: ['objection', 'expensive', 'pricing', 'competitor', 'sales', 'rejection'],
    text: `Handling Common SaaS Sales Objections:
1. 'It’s too expensive' -> 'Totally understand. If this saves 2 hours of front-desk time a day and catches just 3 lost customer orders a week, it pays for itself in 4 days. Would you be open to testing it for 14 days risk-free?'
2. 'We already use a system' -> 'Makes total sense. Most of our users still keep their primary system — this simply sits on top to catch missed inquiries. How are you currently handling after-hours calls?'
3. 'Send me an email' -> 'Happy to send a 60-second summary. What is the single biggest bottleneck in your booking process right now so I only send what is relevant?'
4. 'I don’t have time to set this up' -> 'We do 100% of the white-glove setup in 15 minutes — you don’t have to configure any software. Can I show you how it works on Thursday?'`,
  },
  {
    id: 'demo-script-playbook',
    title: '10-Minute High-Close Demo Script',
    tags: ['demo', 'script', 'closing', 'sales', 'pitch'],
    text: `10-Minute Demo Framework:
1. Minute 0-2 (Discovery & Confirmation): 'Before I show you the tool, tell me: when you miss a customer call during busy hours, what typically happens today?'
2. Minute 2-6 (Show 3 Core Steps Only):
   - Step 1: Customer triggers action (sends SMS or calls).
   - Step 2: Automated response handles the reservation or inquiry in 3 seconds.
   - Step 3: Notification lands on staff tablet with zero manual entry.
3. Minute 6-8 (Pricing & ROI Anchor): 'The full system is $99/month with a one-time $199 setup where we configure your numbers and custom templates.'
4. Minute 8-10 (Close): 'Would you like us to configure your number so it is ready for this weekend’s rush?'`,
  },
  {
    id: 'pricing-packaging',
    title: 'Packaging & Pricing Blueprint',
    tags: ['pricing', 'packaging', 'tiers', 'setup fee', 'retainer', 'subscription'],
    text: `Pricing Architecture for Solo SaaS:
- Tier 1 (Starter - $49/mo): Core automated workflow, 1 phone line, standard email support.
- Tier 2 (Pro - $99/mo to $149/mo - Recommended Anchor): Unlimited automated workflows, custom voice/SMS persona, priority notifications, reporting.
- Setup / Deployment Fee ($199 - $299 one-time): Always charge an upfront onboarding fee. It qualifies the buyer, covers your initial configuration time, and drastically reduces churn.`,
  },
]

export const knowledge = {
  async search(collection, query, options = { k: 4 }) {
    if (!query) return { results: [] }
    const tokens = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2)
    
    const scored = PLAYBOOKS.map((p) => {
      let score = 0
      const content = (p.title + ' ' + p.text + ' ' + p.tags.join(' ')).toLowerCase()
      tokens.forEach((t) => {
        if (content.includes(t)) score += 2
        p.tags.forEach((tag) => {
          if (tag.includes(t) || t.includes(tag)) score += 3
        })
      })
      return { playbook: p, score }
    })

    const top = scored
      .sort((a, b) => b.score - a.score)
      .filter((x) => x.score > 0)
      .slice(0, options.k || 4)
      .map((x) => ({
        id: x.playbook.id,
        title: x.playbook.title,
        text: x.playbook.text,
      }))

    // If query is broad, return the first few playbooks
    const results = top.length > 0 ? top : PLAYBOOKS.slice(0, options.k || 3).map((p) => ({ id: p.id, title: p.title, text: p.text }))
    return { results }
  },
}
