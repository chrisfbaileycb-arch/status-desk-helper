// Marketing / sales workflows Cole can run on the founder's behalf.
// Each recipe produces a ready-to-use asset for ONE product in the portfolio.

export const RECIPES = [
  {
    id: 'cold-email',
    label: 'Cold outreach email',
    blurb: 'A short, specific first-touch email to a prospect.',
    channel: 'email',
    subject: (p) => `Quick idea for your ${p.category || 'business'}`,
    prompt: (p, extra) => `Write a cold outreach EMAIL selling "${p.name}" — ${p.category || 'a software product'}, priced ${p.price || 'TBD'}.

${extra ? `Prospect / context the founder gave you: ${extra}\n` : ''}
Rules: under 130 words. Plain text, no markdown, no emoji. One concrete pain point, one line of proof or mechanism, one soft ask (a 10-minute call). Subject line NOT included — body only. Sign off as the founder with just a first-name placeholder [Your name].`,
  },
  {
    id: 'followup',
    label: 'Follow-up nudge',
    blurb: 'Second/third touch that does not sound needy.',
    channel: 'email',
    subject: (p) => `Following up — ${p.name}`,
    prompt: (p, extra) => `Write a short FOLLOW-UP message for a prospect who did not reply about "${p.name}" (${p.category || 'software'}, ${p.price || 'TBD'}).

${extra ? `Context: ${extra}\n` : ''}
Rules: under 70 words, plain text, no guilt-tripping, add one new piece of value or a specific result, end with an easy yes/no question.`,
  },
  {
    id: 'dm',
    label: 'DM / WhatsApp opener',
    blurb: 'Casual first message for social or WhatsApp.',
    channel: 'whatsapp',
    prompt: (p, extra) => `Write a casual direct-message opener (Instagram DM / WhatsApp style) to a potential customer for "${p.name}" — ${p.category || 'software'}.

${extra ? `Context: ${extra}\n` : ''}
Rules: 2-3 short sentences max, conversational, no emoji, no links, no hard pitch — earn a reply first. Plain text.`,
  },
  {
    id: 'demo-script',
    label: 'Demo call script',
    blurb: 'A 10-minute walkthrough that closes.',
    channel: 'note',
    prompt: (p, extra) => `Write a 10-minute DEMO CALL SCRIPT for "${p.name}" (${p.category || 'software'}, priced ${p.price || 'TBD'}).

${extra ? `Context: ${extra}\n` : ''}
Structure it as: 1) 30-second framing question, 2) three things to show in order and the exact sentence to say for each, 3) the price reveal sentence, 4) the close and the next step. Plain text, numbered, tight — no fluff.`,
  },
  {
    id: 'objections',
    label: 'Objection handling',
    blurb: 'Answers to the four objections you will hear.',
    channel: 'note',
    prompt: (p, extra) => `List the 4 most likely objections a buyer will raise about "${p.name}" (${p.category || 'software'}, priced ${p.price || 'TBD'}) and, for each, the exact words to answer with.

${extra ? `Context: ${extra}\n` : ''}
Format each as: OBJECTION: … / SAY: … . Keep every answer under 40 words, confident, never defensive. Plain text.`,
  },
  {
    id: 'pricing-page',
    label: 'Pricing & packaging',
    blurb: 'Tiers, anchors, and what to put in each.',
    channel: 'note',
    prompt: (p, extra) => `Propose pricing and packaging for "${p.name}" (${p.category || 'software'}). Current price point: ${p.price || 'not set yet'}.

${extra ? `Context: ${extra}\n` : ''}
Give 3 tiers with names, monthly price, and 3-4 bullet inclusions each; say which tier is the anchor and why; then one line on what to charge for setup/onboarding. Plain text.`,
  },
  {
    id: 'landing-copy',
    label: 'Landing page copy',
    blurb: 'Headline, subhead, benefits, CTA.',
    channel: 'note',
    prompt: (p, extra) => `Write landing page copy for "${p.name}" (${p.category || 'software'}, ${p.price || 'TBD'}).

${extra ? `Context: ${extra}\n` : ''}
Deliver: one bold headline (max 6 words), a one-sentence subhead, three benefit blocks (title + one line), a short trust line, and one CTA button label. Plain text, labelled sections.`,
  },
  {
    id: 'launch-post',
    label: 'Launch announcement',
    blurb: 'Social post for the day you ship.',
    channel: 'social',
    prompt: (p, extra) => `Write a launch announcement post for "${p.name}" (${p.category || 'software'}) suitable for LinkedIn or X.

${extra ? `Context: ${extra}\n` : ''}
Rules: hook in the first line, story or problem in the middle, what it does, who it is for, one clear call to action. Under 140 words. Plain text, no hashtags spam (max 2), no emoji.`,
  },
  {
    id: 'icp',
    label: 'Who to sell to first',
    blurb: 'Ideal customer + where to find 20 of them.',
    channel: 'note',
    prompt: (p, extra) => `Define the ideal first customer for "${p.name}" (${p.category || 'software'}, ${p.price || 'TBD'}) and give a concrete prospecting plan.

${extra ? `Context: ${extra}\n` : ''}
Deliver: the exact buyer (role, business type, size), the three signals that make them a good fit, and 5 specific places or methods to find 20 of them this week. Plain text.`,
  },
  {
    id: 'deploy-plan',
    label: 'Deployment run-through',
    blurb: 'Ordered steps to get this one live.',
    channel: 'note',
    prompt: (p, extra) => `Write the ordered deployment run-through to get "${p.name}" live on ${p.platform || 'its platform'} and ready to sell.

${extra ? `Context: ${extra}\n` : ''}
Cover in order: build/publish steps, any infrastructure to wire (numbers, webhooks, keys, billing), a smoke test the founder can run in 5 minutes, and the go-live announcement step. If a step is specific to a platform you are unsure about, say so plainly instead of inventing the UI. Plain text, numbered.`,
  },
]

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id)
}
