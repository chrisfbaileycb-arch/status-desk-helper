import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { ai } from '../lib/ai'
import { auth } from '../lib/auth'
import { email } from '../lib/email'
import { share } from '../lib/share'
import { schedule } from '../lib/schedule'
import { knowledge } from '../lib/knowledge'
import { useLiveShared } from '../lib/useLive'
import { RECIPES } from '../workflows/recipes'
import {
  Loader2, Copy, Mail, MessageCircle, Share2, BellRing, X, Trash2, Zap, Check, ChevronDown,
} from 'lucide-react'

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] md:bottom-8 z-40 px-4 py-2.5 rounded-full bg-[#fffaf2] border border-primary/30 text-primary text-sm shadow-xl">
      {msg}
    </div>
  )
}

/* ── One generated asset, with the real actions attached ───────────── */
function ResultSheet({ product, recipe, initialText, onClose, toast }) {
  const [text, setText] = useState(initialText)
  const [panel, setPanel] = useState(null) // 'email' | 'whatsapp' | 'followup'
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(recipe.subject ? recipe.subject(product) : product.name)
  const [phone, setPhone] = useState('')
  const [days, setDays] = useState(3)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveAsset() {
    await db.insertShared('assets', {
      productId: product.id,
      productName: product.name,
      recipeId: recipe.id,
      recipeLabel: recipe.label,
      text,
      createdAt: Date.now(),
    })
    setSaved(true)
    toast('Saved to this product')
  }

  async function sendEmail() {
    const addr = to.trim()
    if (!addr || busy) return
    setBusy(true)
    try {
      const res = await email.send({ to: addr, subject: subject.trim() || product.name, body: text })
      if (res?.sent) {
        toast(`Sent to ${addr}`)
        await db.insertShared('outreach', {
          productId: product.id,
          productName: product.name,
          channel: 'email',
          to: addr,
          recipeLabel: recipe.label,
          sentAt: Date.now(),
        })
        setPanel(null)
        setTo('')
      } else {
        toast(res?.code === 'QUOTA_EXCEEDED' ? 'Daily send limit reached' : 'Not sent — try again')
      }
    } catch (err) {
      toast(err?.message ? `Not sent: ${err.message}` : 'Not sent')
    } finally {
      setBusy(false)
    }
  }

  function sendWhatsapp() {
    const digits = phone.replace(/[^0-9]/g, '')
    if (!digits) return
    db.insertShared('outreach', {
      productId: product.id,
      productName: product.name,
      channel: 'whatsapp',
      to: digits,
      recipeLabel: recipe.label,
      sentAt: Date.now(),
    }).catch(() => {})
    share.whatsapp(digits, text)
  }

  async function ensureFollowupJob() {
    if (!auth.isAppOwner()) return
    const existing = await db.getShared('settings', 'followup-job').catch(() => null)
    if (existing?.jobId) return
    try {
      const job = await schedule.create({
        daily: '08:30',
        action: 'push',
        target: { broadcast: true },
        source: {
          collection: 'followups',
          window: { dateField: 'dueDate', days: 0, from: -30 },
          sort: { field: 'dueDate', dir: 'asc' },
        },
        title: '{{count}} follow-up(s) due',
        body: '{{#rows}}• {{productName}} — {{who}}\n{{/rows}}',
      })
      await db.upsertShared('settings', { jobId: job?.id || job?.jobId || 'created' }, 'followup-job')
    } catch (err) {
      console.error(err)
    }
  }

  async function setFollowup() {
    if (busy) return
    setBusy(true)
    try {
      const due = new Date(Date.now() + Number(days || 1) * 86400000)
      await db.insertShared('followups', {
        productId: product.id,
        productName: product.name,
        who: to.trim() || phone.trim() || 'this prospect',
        note: `${recipe.label} sent`,
        dueDate: due.toISOString().slice(0, 10),
        done: false,
      })
      await ensureFollowupJob()
      toast(`Follow-up set for ${due.toLocaleDateString()}`)
      setPanel(null)
    } finally {
      setBusy(false)
    }
  }

  const ACTIONS = [
    { id: 'copy', label: 'Copy', icon: Copy, run: async () => { await share.copy(text); toast('Copied') } },
    { id: 'email', label: 'Email it', icon: Mail, run: () => setPanel(panel === 'email' ? null : 'email') },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, run: () => setPanel(panel === 'whatsapp' ? null : 'whatsapp') },
    { id: 'share', label: 'Share', icon: Share2, run: () => share.link({ title: `${product.name} — ${recipe.label}`, text }) },
    { id: 'followup', label: 'Remind me', icon: BellRing, run: () => setPanel(panel === 'followup' ? null : 'followup') },
  ]

  return (
    <div
      className="fixed inset-0 z-40 bg-[#3d2f24]/40 flex items-end md:items-center justify-center"
      style={{ height: 'var(--visual-height, 100dvh)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-2xl bg-[#fffaf2] border border-[#3d2f24]/12 rounded-t-3xl md:rounded-3xl p-5 overflow-y-auto"
        style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-primary text-xs font-medium">{product.name}</p>
            <h2 className="font-display font-bold text-lg text-[#3d2f24] leading-tight">{recipe.label}</h2>
          </div>
          <button onClick={onClose} className="text-[#3d2f24]/60 hover:text-[#3d2f24] p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-2xl p-4 text-sm text-[#3d2f24]/90 leading-relaxed outline-none focus:border-primary/40 resize-none"
        />
        <p className="text-[#3d2f24]/45 text-[11px] mt-1.5">Edit it before you send — it is yours now.</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {ACTIONS.map(({ id, label, icon: Icon, run }) => (
            <button
              key={id}
              onClick={run}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl border transition-colors ${
                panel === id ? 'border-primary/50 bg-primary/10 text-primary' : 'border-[#3d2f24]/12 text-[#3d2f24]/70 hover:text-[#3d2f24]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          <button
            onClick={saveAsset}
            disabled={saved}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium disabled:opacity-40"
          >
            {saved ? <Check size={14} /> : <Zap size={14} />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {panel === 'email' && (
          <div className="mt-4 space-y-2 border-t border-[#3d2f24]/12 pt-4">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="prospect@company.com"
              className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-3.5 py-2.5 text-sm text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-3.5 py-2.5 text-sm text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
            />
            <button
              onClick={sendEmail}
              disabled={busy || !to.trim()}
              className="w-full py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'Sending…' : 'Send this email now'}
            </button>
            <p className="text-[#3d2f24]/45 text-[11px]">
              Goes out from the app to one prospect at a time. One-to-one outreach only — not a bulk blaster.
            </p>
          </div>
        )}

        {panel === 'whatsapp' && (
          <div className="mt-4 space-y-2 border-t border-[#3d2f24]/12 pt-4">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Full number with country code, e.g. 15551234567"
              className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-3.5 py-2.5 text-sm text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
            />
            <button
              onClick={sendWhatsapp}
              disabled={!phone.trim()}
              className="w-full py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium disabled:opacity-40"
            >
              Open WhatsApp with this message
            </button>
            <p className="text-[#3d2f24]/45 text-[11px]">Opens your WhatsApp with the text ready — you press send.</p>
          </div>
        )}

        {panel === 'followup' && (
          <div className="mt-4 space-y-2 border-t border-[#3d2f24]/12 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-[#3d2f24]/65 text-sm">Nudge me in</span>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-16 bg-white/75 border border-[#3d2f24]/12 rounded-xl px-3 py-2 text-sm text-[#3d2f24] outline-none focus:border-primary/40"
              />
              <span className="text-[#3d2f24]/65 text-sm">days</span>
            </div>
            <button
              onClick={setFollowup}
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'Setting…' : 'Set follow-up reminder'}
            </button>
            <p className="text-[#3d2f24]/45 text-[11px]">
              Due follow-ups are pushed to you each morning on the published app (allow notifications once).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function Workflows() {
  const { data: products } = useLiveShared('products', { order: 'name' })
  const [productId, setProductId] = useState('')
  const [extra, setExtra] = useState('')
  const [running, setRunning] = useState('')
  const [result, setResult] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [showExtra, setShowExtra] = useState(false)

  const product = products.find((p) => p.id === productId) || products[0] || null
  const { data: assets } = useLiveShared('assets', {
    filters: product ? { productId: product.id } : { productId: '__none__' },
    order: 'createdAt',
  })
  const { data: followups } = useLiveShared('followups', { filters: { done: false }, order: 'dueDate' })

  useEffect(() => {
    if (!productId && products.length) setProductId(products[0].id)
  }, [products, productId])

  function toast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2600)
  }

  async function run(recipe) {
    if (!product || running) return
    setRunning(recipe.id)
    try {
      let context = ''
      try {
        const { results } = await knowledge.search(
          'echodesk-playbooks',
          `${recipe.label} for ${product.category || ''} ${product.platform || ''}`,
          { k: 3 }
        )
        if (results?.length) context = '\n\nReference material you may draw on:\n' + results.map((r) => r.text).join('\n\n')
      } catch {}
      const { text } = await ai.run(recipe.prompt(product, extra.trim()) + context)
      setResult({ recipe, text: (text || '').trim() })
    } catch (err) {
      toast(err?.message || 'Generation failed — try again')
    } finally {
      setRunning('')
    }
  }

  async function completeFollowup(f) {
    await db.updateShared('followups', f.id, { done: true })
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="pt-[env(safe-area-inset-top,0px)] px-5 py-5 border-b border-[#3d2f24]/12">
        <h1 className="font-display font-bold text-xl text-[#3d2f24]">Workflows</h1>
        <p className="text-[#3d2f24]/60 text-xs mt-0.5">Pick a product, run a play, then send it for real.</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 pb-28 space-y-6">
        {products.length === 0 ? (
          <p className="text-[#3d2f24]/60 text-sm px-1">Add a product in Portfolio first — the plays are written around it.</p>
        ) : (
          <>
            {/* product picker */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProductId(p.id)}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-full border transition-colors ${
                    product?.id === p.id
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-[#3d2f24]/12 text-[#3d2f24]/65 hover:text-[#3d2f24]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* optional context */}
            <div>
              <button
                onClick={() => setShowExtra((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-[#3d2f24]/45 hover:text-[#3d2f24]"
              >
                <ChevronDown size={14} className={showExtra ? 'rotate-180 transition-transform' : 'transition-transform'} />
                Add context for this run (prospect, city, angle)
              </button>
              {showExtra && (
                <textarea
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  rows={3}
                  placeholder="e.g. Independent pizzeria in Tampa, owner is Maria, they lose calls at dinner rush"
                  className="mt-2 w-full bg-white/75 border border-[#3d2f24]/12 rounded-2xl p-3.5 text-sm text-[#3d2f24]/85 placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40 resize-none"
                />
              )}
            </div>

            {/* plays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECIPES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => run(r)}
                  disabled={!!running}
                  className="glass-card rounded-2xl p-4 text-left hover:border-primary/30 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-[#3d2f24] text-sm">{r.label}</h3>
                    {running === r.id ? (
                      <Loader2 size={15} className="text-primary animate-spin shrink-0" />
                    ) : (
                      <Zap size={15} className="text-[#3d2f24]/40 shrink-0" />
                    )}
                  </div>
                  <p className="text-[#3d2f24]/60 text-xs mt-1 leading-relaxed">{r.blurb}</p>
                </button>
              ))}
            </div>

            {/* open follow-ups */}
            {followups.length > 0 && (
              <div>
                <h2 className="font-semibold text-[#3d2f24] text-sm mb-2">Follow-ups due</h2>
                <div className="space-y-2">
                  {followups.map((f) => (
                    <div key={f.id} className="glass-card rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                      <button
                        onClick={() => completeFollowup(f)}
                        className="w-5 h-5 rounded-md border border-[#3d2f24]/25 text-transparent hover:border-primary hover:text-primary flex items-center justify-center shrink-0"
                      >
                        <Check size={13} strokeWidth={3} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[#3d2f24]/85 text-sm truncate">
                          {f.productName} — {f.who}
                        </p>
                        <p className="text-[#3d2f24]/55 text-xs">{f.note} · due {f.dueDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* saved assets for this product */}
            {assets.length > 0 && (
              <div>
                <h2 className="font-semibold text-[#3d2f24] text-sm mb-2">Saved for {product?.name}</h2>
                <div className="space-y-2">
                  {assets.map((a) => (
                    <div key={a.id} className="glass-card rounded-xl p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-primary/90 text-xs font-medium">{a.recipeLabel}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={async () => { await share.copy(a.text); toast('Copied') }}
                            className="text-[#3d2f24]/50 hover:text-[#3d2f24]"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => db.deleteShared('assets', a.id)}
                            className="text-[#3d2f24]/40 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[#3d2f24]/70 text-xs mt-1.5 whitespace-pre-wrap line-clamp-4">{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {result && product && (
        <ResultSheet
          product={product}
          recipe={result.recipe}
          initialText={result.text}
          onClose={() => setResult(null)}
          toast={toast}
        />
      )}
      <Toast msg={toastMsg} />
    </div>
  )
}
