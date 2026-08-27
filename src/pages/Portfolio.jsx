import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveShared } from '../lib/useLive'
import { db } from '../lib/db'
import { Plus, X, ChevronRight } from 'lucide-react'

const STATUSES = ['idea', 'building', 'selling']
const STATUS_STYLE = {
  idea: 'bg-[#3d2f24]/8 text-[#3d2f24]/65',
  building: 'bg-secondary/15 text-secondary',
  selling: 'bg-primary/15 text-primary',
}

function AddModal({ onClose }) {
  const [form, setForm] = useState({ name: '', platform: '', price: '', setupFee: '', category: '', status: 'idea' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      await db.insertShared('products', { ...form, notes: '' })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#3d2f24]/35 z-40 flex items-end md:items-center justify-center"
      style={{ height: 'var(--visual-height, 100dvh)' }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-[#fffaf2] border border-[#3d2f24]/12 rounded-t-3xl md:rounded-3xl p-6 overflow-y-auto"
        style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-[#3d2f24]">New Product</h2>
          <button onClick={onClose} className="text-[#3d2f24]/60 hover:text-[#3d2f24]">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-4 py-2.5 text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
          />
          <input
            placeholder="Platform (e.g. Lovable, Whacka)"
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-4 py-2.5 text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
          />
          <input
            placeholder="Price (e.g. $49-250/mo)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-4 py-2.5 text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
          />
          <input
            placeholder="Setup / deployment fee (optional)"
            value={form.setupFee}
            onChange={(e) => setForm({ ...form, setupFee: e.target.value })}
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-4 py-2.5 text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-white/75 border border-[#3d2f24]/12 rounded-xl px-4 py-2.5 text-[#3d2f24] placeholder:text-[#3d2f24]/50 outline-none focus:border-primary/40"
          />
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 py-2 rounded-xl text-sm capitalize border transition-colors ${
                  form.status === s ? 'border-primary/50 bg-primary/10 text-primary' : 'border-[#3d2f24]/12 text-[#3d2f24]/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving || !form.name.trim()}
          className="w-full mt-5 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-secondary disabled:opacity-40"
        >
          Add product
        </button>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const { data: products, loading } = useLiveShared('products', { order: 'name' })
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto">
      <header className="pt-[env(safe-area-inset-top,0px)] px-5 py-5 flex items-center justify-between border-b border-[#3d2f24]/12">
        <div>
          <h1 className="font-display font-bold text-xl text-[#3d2f24]">Portfolio</h1>
          <p className="text-[#3d2f24]/60 text-xs mt-0.5">{products.length} products tracked</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 pb-24">
        {loading ? (
          <p className="text-[#3d2f24]/50 text-sm px-2">Loading…</p>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-[#3d2f24]/60 text-sm">No products yet. Add your first one to start tracking deployment and sales progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/portfolio/${p.id}`)}
                className="glass-card rounded-2xl p-4 text-left hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#3d2f24] leading-snug">{p.name}</h3>
                  <ChevronRight size={18} className="text-[#3d2f24]/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                </div>
                <p className="text-[#3d2f24]/60 text-xs mt-1">{p.platform || 'Platform TBD'}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-primary/90 text-sm font-medium truncate">
                    {p.price || 'TBD'}
                    {p.setupFee ? <span className="text-[#3d2f24]/55 font-normal"> · {p.setupFee} setup</span> : null}
                  </span>
                  <span className={`text-[11px] px-2 py-1 rounded-full capitalize ${STATUS_STYLE[p.status] || STATUS_STYLE.idea}`}>
                    {p.status || 'idea'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
