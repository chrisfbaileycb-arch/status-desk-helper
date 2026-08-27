import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import { useLiveShared } from '../lib/useLive'
import { ai } from '../lib/ai'
import { knowledge } from '../lib/knowledge'
import { ArrowLeft, Trash2, Sparkles, Plus, Check, Loader2, Pencil, MessageCircle, ChevronRight } from 'lucide-react'

const STATUSES = ['idea', 'building', 'selling']

function EditableField({ label, value, placeholder, accent, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  async function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next !== (value || '')) await onSave(next)
  }

  return (
    <div className="min-w-0">
      <p className="text-[#3d2f24]/60 text-xs">{label}</p>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(value || ''); setEditing(false) }
          }}
          placeholder={placeholder}
          className="mt-0.5 w-full max-w-[14rem] bg-white/75 border border-primary/40 rounded-lg px-2 py-1 text-sm text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`mt-0.5 flex items-center gap-1.5 text-left group ${accent ? 'text-primary font-semibold' : 'text-[#3d2f24]/85 text-sm'}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <Pencil size={12} className="text-[#3d2f24]/40 group-hover:text-primary shrink-0 transition-colors" />
        </button>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newTask, setNewTask] = useState('')

  const { data: tasks } = useLiveShared('tasks', { filters: { productId: id }, order: 'createdAt' })
  const [threads, setThreads] = useState([])

  useEffect(() => {
    db.getShared('products', id).then((p) => {
      setProduct(p)
      setNotes(p?.notes || '')
    })
    db.select('coach_threads', { productId: id }, { order: '-updatedAt', limit: 50 })
      .then(setThreads)
      .catch(() => {})
  }, [id])

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await db.updateShared('products', id, { notes })
    } finally {
      setSavingNotes(false)
    }
  }

  async function saveField(field, value) {
    await db.updateShared('products', id, { [field]: value })
    setProduct((p) => ({ ...p, [field]: value }))
  }

  async function setStatus(status) {
    await db.updateShared('products', id, { status })
    setProduct((p) => ({ ...p, status }))
  }

  async function removeProduct() {
    if (!confirm(`Remove ${product?.name} from your portfolio?`)) return
    await db.deleteShared('products', id)
    navigate('/portfolio')
  }

  async function addTask() {
    const text = newTask.trim()
    if (!text) return
    setNewTask('')
    await db.insertShared('tasks', { productId: id, text, done: false, kind: 'manual' })
  }

  async function toggleTask(t) {
    await db.updateShared('tasks', t.id, { done: !t.done })
  }

  async function removeTask(t) {
    await db.deleteShared('tasks', t.id)
  }

  async function generateChecklist() {
    if (!product || generating) return
    setGenerating(true)
    try {
      const { results } = await knowledge.search(
        'echodesk-playbooks',
        `deployment and sales checklist for ${product.category} product on ${product.platform}`,
        { k: 6 }
      )
      const context = results.map((r) => r.text).join('\n\n')
      const { json } = await ai.run(
        `You are helping a founder ship and sell a product called "${product.name}" (category: ${product.category}, platform: ${product.platform}, price: ${product.price}, status: ${product.status}).\n\nUsing the reference playbook material below where relevant, produce a short actionable checklist of 6-10 concrete next steps covering BOTH deployment/setup and sales/outreach for this specific product. Keep each step under 100 characters, imperative voice.\n\nREFERENCE:\n${context}\n\nReturn ONLY JSON: { "steps": ["...", "..."] }`,
        { json: true }
      )
      const steps = json?.steps || []
      for (const s of steps) {
        await db.insertShared('tasks', { productId: id, text: s, done: false, kind: 'ai' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[#3d2f24]/50 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="pt-[env(safe-area-inset-top,0px)] px-4 py-4 flex items-center gap-3 border-b border-[#3d2f24]/12">
        <button onClick={() => navigate('/portfolio')} className="text-[#3d2f24]/65 hover:text-[#3d2f24] p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-lg text-[#3d2f24] truncate">{product.name}</h1>
          <p className="text-[#3d2f24]/60 text-xs">{product.platform || 'Platform TBD'}</p>
        </div>
        <button onClick={removeProduct} className="text-[#3d2f24]/50 hover:text-red-400 p-2">
          <Trash2 size={18} />
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6 pb-24">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
          <EditableField
            label="Price"
            value={product.price}
            placeholder="Set price"
            accent
            onSave={(v) => saveField('price', v)}
          />
          <EditableField
            label="Setup / deployment fee"
            value={product.setupFee}
            placeholder="Set fee"
            accent
            onSave={(v) => saveField('setupFee', v)}
          />
          <EditableField
            label="Platform"
            value={product.platform}
            placeholder="Set platform"
            onSave={(v) => saveField('platform', v)}
          />
          <EditableField
            label="Category"
            value={product.category}
            placeholder="Set category"
            onSave={(v) => saveField('category', v)}
          />
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full capitalize border transition-colors ${
                  product.status === s ? 'border-primary/50 bg-primary/10 text-primary' : 'border-[#3d2f24]/12 text-[#3d2f24]/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[#3d2f24] text-sm">Deployment & Sales Checklist</h2>
            <button
              onClick={generateChecklist}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-medium disabled:opacity-40"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {generating ? 'Generating…' : 'AI generate steps'}
            </button>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-[#3d2f24]/50 text-sm px-1 py-3">
                No steps yet. Add one manually or let Cole generate a tailored checklist.
              </p>
            )}
            {tasks.map((t) => (
              <div key={t.id} className="glass-card rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                <button
                  onClick={() => toggleTask(t)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    t.done ? 'bg-primary border-primary text-white' : 'border-[#3d2f24]/25 text-transparent'
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </button>
                <span className={`flex-1 text-sm ${t.done ? 'text-[#3d2f24]/50 line-through' : 'text-[#3d2f24]/85'}`}>{t.text}</span>
                <button onClick={() => removeTask(t)} className="text-[#3d2f24]/40 hover:text-red-400 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a step…"
              className="flex-1 bg-white/75 border border-[#3d2f24]/12 rounded-xl px-3.5 py-2.5 text-sm text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
            />
            <button
              onClick={addTask}
              className="w-10 h-10 rounded-xl bg-white/75 border border-[#3d2f24]/12 text-[#3d2f24]/70 flex items-center justify-center shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[#3d2f24] text-sm">Pinned conversations</h2>
            <button
              onClick={() => navigate('/')}
              className="text-xs px-3 py-1.5 rounded-full border border-[#3d2f24]/20 text-[#3d2f24]/65 hover:text-[#3d2f24]"
            >
              New chat
            </button>
          </div>
          <div className="space-y-2">
            {threads.length === 0 && (
              <p className="text-[#3d2f24]/50 text-sm px-1 py-2 leading-relaxed">
                No chats pinned here yet. In a conversation with Cole, tap the pin and choose {product.name} — the
                strategy will live on this page.
              </p>
            )}
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/?thread=${t.id}`)}
                className="w-full glass-card rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
              >
                <MessageCircle size={15} className="text-primary shrink-0" />
                <span className="flex-1 text-sm text-[#3d2f24]/85 truncate">{t.title}</span>
                <ChevronRight size={15} className="text-[#3d2f24]/40 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#3d2f24] text-sm mb-2">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={5}
            placeholder="Client contacts, Twilio numbers in use, deal status, anything you want to remember…"
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-2xl p-3.5 text-sm text-[#3d2f24]/85 placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40 resize-none"
          />
          {savingNotes && <p className="text-[#3d2f24]/40 text-xs mt-1">Saving…</p>}
        </div>
      </div>
    </div>
  )
}
