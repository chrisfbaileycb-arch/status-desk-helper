// AI assistant engine for Cole (Sales & Deployment Advisor)

function extractProductFromPrompt(prompt) {
  const nameMatch = prompt.match(/product called "([^"]+)"/i) || prompt.match(/selling "([^"]+)"/i) || prompt.match(/about "([^"]+)"/i)
  const categoryMatch = prompt.match(/category:\s*([^,\n]+)/i)
  const platformMatch = prompt.match(/platform:\s*([^,\n]+)/i)
  const priceMatch = prompt.match(/price:\s*([^,\n]+)/i)

  return {
    name: nameMatch ? nameMatch[1] : 'your product',
    category: categoryMatch ? categoryMatch[1].trim() : 'Software',
    platform: platformMatch ? platformMatch[1].trim() : 'Web',
    price: priceMatch ? priceMatch[1].trim() : '$99/mo',
  }
}

function generateRecipeResponse(prompt) {
  const p = extractProductFromPrompt(prompt)
  const lower = prompt.toLowerCase()

  if (lower.includes('cold outreach email') || lower.includes('cold outreach')) {
    return `Hi [First Name],

Noticed that handling ${p.category.toLowerCase() || 'customer requests'} during peak hours creates long delays and lost business for your team.

We built ${p.name} specifically to solve this — automating the intake and confirmation in under 5 seconds so your staff never misses an opportunity.

Other businesses in your space are saving 10+ hours a week and increasing booking completions by 24%.

Would you be open to a quick 5-minute look this Thursday to see if it makes sense for your setup?

Best,
[Your name]`
  }

  if (lower.includes('follow-up') || lower.includes('follow up')) {
    return `Hi [First Name],

Wanted to share a quick 1-line update: one of our clients just automated over 40 ${p.category.toLowerCase() || 'customer'} interactions in their first weekend using ${p.name}.

Would you still like to take a look at the 3-minute walkthrough? Either way, let me know!

Best,
[Your name]`
  }

  if (lower.includes('direct-message') || lower.includes('dm / whatsapp')) {
    return `Hey [Name]! Love what you guys are doing with the business. Quick question — how are you currently managing ${p.category.toLowerCase() || 'inquiries'} when staff is busy? We put together a lightweight tool that automates it and wanted to share a 60-second video if you're open to it.`
  }

  if (lower.includes('demo call script') || lower.includes('demo script')) {
    return `10-MINUTE DEMO SCRIPT FOR ${p.name.toUpperCase()}

1. 30-Second Discovery Question:
"Before I pull up the screen: when you get busy on peak days, what's currently the single biggest hassle with ${p.category.toLowerCase() || 'operations'}?"

2. Three Things to Show:
- Step 1 (Intake): "Here's what your customer sees on their phone — clean, fast, and takes under 10 seconds."
- Step 2 (Automation): "Once submitted, ${p.name} automatically verifies the details and routes the notification instantly."
- Step 3 (Dashboard): "On your side, you get an organized live list with zero manual data entry."

3. Price Reveal:
"${p.name} is ${p.price} with a one-time onboarding fee where we configure everything for your team."

4. Close & Next Step:
"If you like how simple this looks, we can have your account configured and ready for live testing by Friday. Want us to get that started?"`
  }

  if (lower.includes('objection handling') || lower.includes('objections')) {
    return `OBJECTION: "It's too expensive for us right now."
SAY: "I completely understand. If this catches just 2-3 missed opportunities a month, it pays for itself several times over. Would you be open to testing it for 14 days to see the actual numbers?"

OBJECTION: "We already have a system that does part of this."
SAY: "That's great — we designed ${p.name} to sit alongside your existing tools without replacing them, specifically targeting the bottlenecks your current system misses."

OBJECTION: "Send me an email with information."
SAY: "Happy to send over a 60-second video demo. What is the single biggest priority for your team this quarter so I only include what's relevant?"

OBJECTION: "I don't have time to set up new software."
SAY: "We handle 100% of the initial setup and testing for you in under 15 minutes — your team doesn't have to configure anything."`
  }

  if (lower.includes('pricing & packaging') || lower.includes('pricing and packaging')) {
    return `PRICING & PACKAGING FOR ${p.name.toUpperCase()}

Tier 1: Starter — $49/mo
- Single location / workflow
- Up to 250 automated interactions/month
- Standard email support

Tier 2: Growth (Recommended Anchor) — $99/mo
- Full automation suite
- Unlimited interactions
- Custom branding & instant SMS/Voice routing
- Priority support & weekly summary reports

Tier 3: Multi-Location / Pro — $199/mo
- Multi-user & multi-location support
- Dedicated phone lines & custom webhook integrations
- 1-on-1 onboarding & quarterly reviews

Setup / Onboarding Fee:
Charge a $199 one-time setup fee for white-glove number configuration and template customization. This filters out tire-kickers and funds your customer acquisition costs.`
  }

  if (lower.includes('landing page copy') || lower.includes('landing copy')) {
    return `HEADLINE:
Never Lose a Customer Again

SUBHEAD:
${p.name} gives your business automated 24/7 ${p.category.toLowerCase() || 'support'}, helping you capture more bookings and eliminate front-desk chaos.

BENEFIT 1: Instant Response
Respond to inquiries in under 5 seconds, even during peak rush hours.

BENEFIT 2: Zero Setup Headaches
Plugs directly into your existing workflow with zero complicated software to learn.

BENEFIT 3: Measurable ROI
Track every captured customer and recovered inquiry directly in your dashboard.

TRUST STATEMENT:
Trusted by growing businesses to manage over 10,000 monthly interactions.

PRIMARY CTA:
Start Your 14-Day Free Trial`
  }

  if (lower.includes('launch announcement') || lower.includes('launch post')) {
    return `Most local businesses lose 20-30% of incoming leads simply because staff is too busy to pick up or reply immediately.

We just launched ${p.name} to fix this.

It's a streamlined, 24/7 automated ${p.category.toLowerCase() || 'assistant'} built specifically to capture inquiries, answer common questions, and confirm bookings in seconds.

Built for simplicity. Takes under 15 minutes to go live.

Check it out or DM me for a quick 60-second walkthrough! #SaaS #BuildInPublic`
  }

  if (lower.includes('ideal customer') || lower.includes('who to sell to first')) {
    return `IDEAL FIRST CUSTOMER PROFILE FOR ${p.name.toUpperCase()}

Target Buyer:
Owner, General Manager, or Lead Operator of 1-3 location ${p.category || 'local businesses'} with 5-25 staff members.

Key Signals:
1. High inbound volume during peak business hours where calls or messages go unanswered.
2. Active Google Business profile with customer reviews mentioning busy wait times or communication delays.
3. Owner actively involved in daily operations who feels the pain of repetitive inquiries.

Where to Find 20 Prospects This Week:
1. Local Yelp & Google Maps search in target metro areas with 50+ reviews.
2. Local Chamber of Commerce business directories.
3. Industry-specific Facebook & LinkedIn founder groups.
4. Instagram profiles of local businesses with active stories and DMs.
5. In-person walk-ins during slow mid-week hours (2-4 PM) for direct introductions.`
  }

  if (lower.includes('deployment run-through') || lower.includes('deploy-plan')) {
    return `DEPLOYMENT RUN-THROUGH FOR ${p.name.toUpperCase()} (${p.platform})

1. Infrastructure & Environment:
- Verify your environment variables and webhook endpoints are deployed to production.
- If using Twilio: Verify local phone number is purchased, A2P 10DLC Campaign is approved, and Webhook URL is set to HTTP POST.

2. Billing & Authentication:
- Test Stripe subscription checkout in live mode with a real card.
- Confirm welcome email or automated onboarding trigger fires on successful signup.

3. 5-Minute Smoke Test:
- Submit a test inquiry from a clean mobile browser.
- Verify instant notification arrives and data saves cleanly to the database.

4. Go-Live Announcement:
- Send personal 1-to-1 launch notes to your first 5 beta contacts.
- Publish launch announcement on LinkedIn and X.`
  }

  // Generic fallback response
  return `Here is the tailored strategy for ${p.name}:

1. Core Focus: Position ${p.name} as the fastest way for ${p.category.toLowerCase()} businesses to eliminate manual operational friction.
2. Pricing: Anchor at ${p.price || '$99/mo'} with an upfront onboarding fee of $199.
3. Immediate Action: Reach out to 10 qualified prospects with a 120-word direct email offering a 5-minute video walkthrough.`
}

function generateChecklistSteps(prompt) {
  const p = extractProductFromPrompt(prompt)
  return [
    `Buy dedicated Twilio number in client's local area code`,
    `Register Twilio A2P 10DLC Brand & Campaign for SMS approval`,
    `Configure live messaging/voice webhook endpoint for ${p.name}`,
    `Enable Twilio billing auto-recharge ($10 threshold)`,
    `Test live Stripe payment checkout link ($${p.price.replace(/[^0-9]/g, '') || '99'})`,
    `Run end-to-end mobile smoke test on ${p.platform || 'production'}`,
    `Build list of 20 target ${p.category || 'business'} prospects on Google Maps`,
    `Send personalized 5-minute demo offer to 10 business owners`,
    `Set follow-up reminder for 3 days post-outreach`,
  ]
}

function generateColeChatReply(system, messages) {
  const lastMsg = messages[messages.length - 1]?.content || ''
  const lower = lastMsg.toLowerCase()

  if (lower.includes('twilio') || lower.includes('phone') || lower.includes('sms') || lower.includes('voice') || lower.includes('webhook')) {
    return `Here is your exact Twilio setup roadmap:

1. **Purchase Dedicated Number**: Go to Twilio Console > Phone Numbers > Manage > Buy Number. Make sure SMS/Voice capabilities match your product requirements.
2. **A2P 10DLC Registration**: In Messaging > Trust Hub > A2P 10DLC, submit your Brand and Campaign registration. Explicitly state how customers opt in (e.g. "Customer enters phone on website form to receive status updates").
3. **Configure Webhook**: In Phone Numbers > Active Numbers > Click your number > set 'A Message Comes In' to Webhook (HTTP POST) with your app's live endpoint.
4. **Enable Auto-Recharge**: Under Billing > Preferences, turn on Auto-Recharge with a $10 trigger and $20 recharge amount so messages never drop during peak rushes.

What specific error or step in Twilio are you looking at right now?`
  }

  if (lower.includes('checklist') || lower.includes('pre-launch') || lower.includes('deploy') || lower.includes('publish')) {
    return `Here is your pre-launch & deployment checklist:

1. **Domain & SSL**: Connect your custom domain and verify SSL is valid on both apex and www subdomains.
2. **Webhook Verification**: Test all incoming/outgoing webhooks (Twilio, Stripe, Supabase) with live payload testing.
3. **Live Stripe Payment Test**: Run a real transaction to verify invoice generation and customer provisioning.
4. **Mobile Responsiveness**: Test touch targets and keyboards on iOS Safari and Android Chrome.
5. **Cold Outreach Ready**: Have 3 custom outreach templates saved in Workflows before hitting publish.

Which of these steps is currently in progress?`
  }

  if (lower.includes('expensive') || lower.includes('objection') || lower.includes('too high') || lower.includes('pricing objection')) {
    return `When a prospect says **"It's too expensive"**, here is the exact script to use:

> *"I completely understand. When you look at the 2 hours a day your staff spends manually managing this — plus the 3 to 5 customer orders that get lost during rush hours — this pays for itself in less than a week.*
> 
> *Would you be open to trying it for 14 days risk-free to see the real numbers before making a decision?"*

**Key strategy**: Never defend the price. Shift the frame immediately from cost to recovered revenue and saved labor hours.`
  }

  if (lower.includes('cold') || lower.includes('outreach') || lower.includes('email') || lower.includes('message') || lower.includes('pitch')) {
    return `Here is a high-converting cold email template for your product:

**Subject:** Quick idea for your front desk

*Hi [First Name],*

*Noticed that during peak hours, handling customer inquiries and bookings takes up significant front-desk attention.*

*We built a dedicated tool that automates this in under 5 seconds so your staff never loses a customer.*

*Other operators in your area are saving 10+ hours a week and capturing 20% more bookings.*

*Open to a quick 5-minute look this Thursday to see if it makes sense for your setup?*

*Best,*  
*[Your name]*

You can also run the **Cold outreach email** workflow in the Workflows tab to customize this directly for any product in your portfolio!`
  }

  return `Got it. Here is the direct recommendation for pushing your product forward:

1. **Keep the Offer Low Friction**: When reaching out to owners, never ask for a 30-minute demo. Ask for a 5-minute video look or 2-question feedback.
2. **Standardize Your Packaging**: Price at a recurring monthly retainer (e.g. $99-$149/mo) and always charge an upfront setup fee ($199-$299) to cover configuration and lock in commitment.
3. **Action Step**: Check the **Workflows** tab to generate ready-to-send outreach copy, objection scripts, or deployment checklists.

Tell me which specific product or bottleneck we should tackle next!`
}

export const ai = {
  async chat({ system = '', messages = [] }) {
    // Simulate slight delay for realistic assistant feel
    await new Promise((r) => setTimeout(r, 450))
    const text = generateColeChatReply(system, messages)
    return { text }
  },

  async run(prompt, options = {}) {
    await new Promise((r) => setTimeout(r, 400))
    if (options.json) {
      const steps = generateChecklistSteps(prompt)
      return { json: { steps } }
    }
    const text = generateRecipeResponse(prompt)
    return { text }
  },
}
