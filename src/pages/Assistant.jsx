import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ai } from '../lib/ai'
import { db } from '../lib/db'
import { knowledge } from '../lib/knowledge'
import { COACH } from '../personas/coach'
import { Send, Sparkles, Plus, History, Pin, X, Trash2, MessageCircle } from 'lucide-react'

const LEGACY = '__legacy__'

function titleFrom(text) {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 46 ? t.slice(0, 46) + '…' : t
}

export default function Assistant() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const [threads, setThreads] = useState([])
  const [allMessages, setAllMessages] = useState([])
  const [activeId, setActiveId] = useState(params.get('thread') || null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [products, setProducts] = useState([])
  const [drawer, setDrawer] = useState(false)
  const [pinSheet, setPinSheet] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    db.select('coach_threads', {}, { order: '-updatedAt', limit: 100 })
      .then(setThreads)
      .catch(() => {})
    db.select('coach_messages', {}, { order: 'createdAt', limit: 600 })
      .then(setAllMessages)
      .catch(() => {})
    db.selectShared('products', {}, { limit: 60 }).then(setProducts).catch(() => {})
  }, [])

  const legacyCount = useMemo(() => allMessages.filter((m) => !m.threadId).length, [allMessages])

  const threadList = useMemo(() => {
    const list = [...threads]
    if (legacyCount > 0) {
      list.push({ id: LEGACY, title: 'Earlier conversation', updatedAt: 0, legacy: true })
    }
    return list
  }, [threads, legacyCount])

  // Pick a sensible active thread once data is in
  useEffect(() => {
    if (activeId) return
    const urlThread = params.get('thread')
    if (urlThread) {
      setActiveId(urlThread)
      return
    }
    if (threadList.length) setActiveId(threadList[0].id)
  }, [threadList, params, activeId])

  useEffect(() => {
    const urlThread = params.get('thread')
    if (urlThread && urlThread !== activeId) setActiveId(urlThread)
  }, [params])

  const activeThread = threadList.find((t) => t.id === activeId) || null

  const messages = useMemo(() => {
    if (!activeId) return []
    if (activeId === LEGACY) return allMessages.filter((m) => !m.threadId)
    return allMessages.filter((m) => m.threadId === activeId)
  }, [allMessages, activeId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  function newChat() {
    setActiveId(null)
    setParams({}, { replace: true })
    setDrawer(false)
  }

  function openThread(id) {
    setActiveId(id)
    setParams({ thread: id }, { replace: true })
    setDrawer(false)
  }

  async function removeThread(t) {
    if (!confirm(`Delete "${t.title}"? The messages in it are removed too.`)) return
    const msgs = allMessages.filter((m) => m.threadId === t.id)
    for (const m of msgs) await db.delete('coach_messages', m.id)
    await db.delete('coach_threads', t.id)
    setAllMessages((prev) => prev.filter((m) => m.threadId !== t.id))
    setThreads((prev) => prev.filter((x) => x.id !== t.id))
    if (activeId === t.id) newChat()
  }

  async function pinTo(product) {
    if (!activeThread || activeThread.legacy) return
    const patch = product
      ? { productId: product.id, productName: product.name }
      : { productId: '', productName: '' }
    await db.update('coach_threads', activeThread.id, patch)
    setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, ...patch } : t)))
    setPinSheet(false)
  }

  async function send(presetText) {
    const text = (presetText ?? input).trim()
    if (!text || sending) return
    setInput('')
    setSending(true)

    let threadId = activeId
    let thread = activeThread

    try {
      if (!threadId || threadId === LEGACY) {
        const created = await db.insert('coach_threads', {
          title: titleFrom(text),
          productId: '',
          productName: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        if (!created?.id) throw new Error('Could not start a new conversation')
        thread = created
        threadId = created.id
        setThreads((prev) => [created, ...prev])
        setActiveId(threadId)
        setParams({ thread: threadId }, { replace: true })
      }

      const userMsg = await db.insert('coach_messages', {
        threadId,
        role: 'user',
        content: text,
        createdAt: Date.now(),
      })
      const history = [...allMessages.filter((m) => m.threadId === threadId), userMsg]
      setAllMessages((prev) => [...prev, userMsg])

      let contextBlock = ''
      if (text.length > 3) {
        const { results } = await knowledge.search('echodesk-playbooks', text, { k: 4 })
        if (results.length) {
          contextBlock =
            '\n\nRelevant playbook reference (use if helpful, ignore if not applicable):\n' +
            results.map((r) => r.text).join('\n\n---\n\n')
        }
      }

      const portfolioBlock = products.length
        ? "\n\nFounder's current product portfolio:\n" +
          products
            .map(
              (p) =>
                `- ${p.name} | platform: ${p.platform} | price: ${p.price}${
                  p.setupFee ? ` | setup: ${p.setupFee}` : ''
                } | status: ${p.status}`
            )
            .join('\n')
        : ''

      const pinned = thread?.productName
        ? `\n\nThis conversation is pinned to the product "${thread.productName}". Keep your answers focused on that product unless told otherwise.`
        : ''

      const reply = await ai.chat({
        system: COACH.system + portfolioBlock + pinned + contextBlock,
        messages: history.slice(-30).map((m) => ({ role: m.role, content: m.content })),
      })

      const asstMsg = await db.insert('coach_messages', {
        threadId,
        role: 'assistant',
        content: reply.text,
        createdAt: Date.now(),
      })
      setAllMessages((prev) => [...prev, asstMsg])
      await db.update('coach_threads', threadId, { updatedAt: Date.now() })
      setThreads((prev) =>
        [...prev.map((t) => (t.id === threadId ? { ...t, updatedAt: Date.now() } : t))].sort(
          (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
        )
      )
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const displayed =
    messages.length === 0 ? [{ role: 'assistant', content: COACH.greeting, createdAt: 0 }] : messages

  const QUICK_PROMPTS = [
    'Walk me through setting up Twilio for a new client',
    'Give me a pre-launch checklist for my next deploy',
    'Write a cold outreach message for a restaurant product',
    'Help me handle "it\'s too expensive"',
  ]

  const ThreadList = (
    <div className="flex flex-col h-full min-h-0">
      <button
        onClick={newChat}
        className="mx-3 mt-3 mb-2 shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        <Plus size={16} /> New chat
      </button>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4 space-y-1">
        {threadList.length === 0 && (
          <p className="text-[#3d2f24]/50 text-xs px-3 py-4 leading-relaxed">
            No conversations yet. Start one and it'll be saved here.
          </p>
        )}
        {threadList.map((t) => (
          <div
            key={t.id}
            className={`group rounded-xl px-3 py-2.5 flex items-start gap-2 cursor-pointer transition-colors ${
              t.id === activeId ? 'bg-primary/15 border border-primary/30' : 'hover:bg-white/75 border border-transparent'
            }`}
            onClick={() => openThread(t.id)}
          >
            <MessageCircle size={14} className={`mt-0.5 shrink-0 ${t.id === activeId ? 'text-primary' : 'text-[#3d2f24]/50'}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] leading-snug ${t.id === activeId ? 'text-[#3d2f24]' : 'text-[#3d2f24]/75'}`}>
                {t.title}
              </p>
              {t.productName && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full">
                  <Pin size={9} /> {t.productName}
                </span>
              )}
            </div>
            {!t.legacy && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeThread(t)
                }}
                className="text-[#3d2f24]/35 hover:text-red-400 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="h-full flex min-h-0">
      {/* Recent chats — persistent on wide screens */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col border-r border-[#3d2f24]/12 bg-[#f0e5d5] pt-[env(safe-area-inset-top,0px)]">
        <p className="px-4 pt-4 text-[11px] uppercase tracking-widest text-[#3d2f24]/50 font-semibold">Recent chats</p>
        {ThreadList}
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-40 flex" style={{ height: 'var(--visual-height, 100dvh)' }}>
          <div className="absolute inset-0 bg-[#3d2f24]/40" onClick={() => setDrawer(false)} />
          <div className="relative w-72 max-w-[82%] h-full bg-[#fffaf2] border-r border-[#3d2f24]/12 flex flex-col pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center justify-between px-4 pt-4">
              <p className="text-[11px] uppercase tracking-widest text-[#3d2f24]/60 font-semibold">Recent chats</p>
              <button onClick={() => setDrawer(false)} className="text-[#3d2f24]/60 p-1">
                <X size={18} />
              </button>
            </div>
            {ThreadList}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <header
          className="shrink-0 border-b border-[#3d2f24]/12 pt-[env(safe-area-inset-top,0px)] px-4 py-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(180deg, rgba(196,92,52,0.10), transparent)' }}
        >
          <button onClick={() => setDrawer(true)} className="lg:hidden text-[#3d2f24]/65 p-1.5 -ml-1.5">
            <History size={20} />
          </button>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/25 border border-primary/30 flex items-center justify-center shrink-0">
            <Sparkles className="text-primary" size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-base text-[#3d2f24] leading-tight truncate">
              {activeThread && !activeThread.legacy ? activeThread.title : COACH.name}
            </h1>
            <p className="text-[#3d2f24]/60 text-xs truncate">{COACH.tagline}</p>
          </div>
          <button
            onClick={() => setPinSheet(true)}
            disabled={!activeThread || activeThread.legacy}
            className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-30 ${
              activeThread?.productName
                ? 'border-secondary/40 bg-secondary/15 text-secondary'
                : 'border-[#3d2f24]/20 text-[#3d2f24]/65'
            }`}
          >
            <Pin size={12} />
            <span className="hidden sm:inline max-w-[9rem] truncate">
              {activeThread?.productName || 'Pin to product'}
            </span>
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          <div className="max-w-3xl w-full mx-auto space-y-3">
            {displayed.map((m, i) => (
              <div key={m.id || i} className={m.role === 'user' ? 'ml-10 md:ml-24 text-right' : 'mr-10 md:mr-24'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'inline-block text-left bg-gradient-to-br from-primary to-secondary text-white font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-full whitespace-pre-wrap'
                      : 'inline-block text-left glass-card text-[#3d2f24]/90 px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-full whitespace-pre-wrap'
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="mr-10 md:mr-24">
                <div className="inline-block glass-card px-4 py-2.5 rounded-2xl rounded-tl-sm text-[#3d2f24]/60 text-sm">
                  Cole is thinking…
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs px-3 py-2 rounded-xl glass-card text-[#3d2f24]/70 hover:text-[#3d2f24] hover:border-primary/40 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-[#3d2f24]/12 p-3 pb-[calc(0.75rem+4.5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask Cole anything about deploying or selling…"
              className="flex-1 bg-white/75 border border-[#3d2f24]/12 rounded-full px-4 py-3 outline-none text-[#3d2f24] placeholder:text-[#3d2f24]/50 focus:border-primary/50"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Pin-to-product sheet */}
      {pinSheet && (
        <div
          className="fixed inset-0 z-40 bg-[#3d2f24]/40 flex items-end md:items-center justify-center"
          style={{ height: 'var(--visual-height, 100dvh)' }}
          onClick={() => setPinSheet(false)}
        >
          <div
            className="w-full md:max-w-sm bg-[#fffaf2] border border-[#3d2f24]/12 rounded-t-3xl md:rounded-3xl p-5 overflow-y-auto"
            style={{ maxHeight: 'calc(var(--visual-height, 100dvh) - 3rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-[#3d2f24] mb-1">Pin this chat</h2>
            <p className="text-[#3d2f24]/60 text-xs mb-4">
              It'll show up on that product's page so the strategy stays with what you're selling.
            </p>
            <div className="space-y-1.5">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pinTo(p)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                    activeThread?.productId === p.id
                      ? 'border-primary/40 bg-primary/10 text-[#3d2f24]'
                      : 'border-[#3d2f24]/12 text-[#3d2f24]/75 hover:bg-white/75'
                  }`}
                >
                  <span className="text-sm">{p.name}</span>
                  <span className="block text-[11px] text-[#3d2f24]/55">{p.platform}</span>
                </button>
              ))}
              {products.length === 0 && (
                <p className="text-[#3d2f24]/50 text-sm py-2">Add a product to your portfolio first.</p>
              )}
              {activeThread?.productId && (
                <button
                  onClick={() => pinTo(null)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-[#3d2f24]/65 text-sm hover:bg-white/75"
                >
                  Unpin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
