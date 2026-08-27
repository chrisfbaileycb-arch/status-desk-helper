// In-memory + LocalStorage reactive database engine

const DB_PREFIX = 'echodesk_db_'

const listeners = new Map()

export function subscribeCollection(collection, callback) {
  if (!listeners.has(collection)) {
    listeners.set(collection, new Set())
  }
  listeners.get(collection).add(callback)
  return () => {
    const set = listeners.get(collection)
    if (set) {
      set.delete(callback)
      if (set.size === 0) listeners.delete(collection)
    }
  }
}

function notifyCollection(collection) {
  const set = listeners.get(collection)
  if (set) {
    set.forEach((cb) => {
      try {
        cb()
      } catch (err) {
        console.error('DB subscriber error:', err)
      }
    })
  }
}

const SEED_DATA = {
  products: [
    {
      id: 'prod_1',
      name: 'TableReady SMS Waitlist',
      platform: 'Lovable',
      price: '$99/mo',
      setupFee: '$199',
      category: 'Restaurant Tech',
      status: 'selling',
      notes: 'Targeting busy pizza and Italian restaurants. Twilio SMS webhook connected.\nPrimary contact: Tony @ Luigi’s.',
    },
    {
      id: 'prod_2',
      name: '24/7 AI Voice Receptionist',
      platform: 'Whacka',
      price: '$149/mo',
      setupFee: '$299',
      category: 'Local Services',
      status: 'building',
      notes: 'Using Twilio Voice Webhook to route missed calls to AI assistant. Need to finish fallback prompt.',
    },
    {
      id: 'prod_3',
      name: 'ReviewBooster Automated SMS',
      platform: 'Emergent',
      price: '$49/mo',
      setupFee: '$99',
      category: 'Dental & Medspa',
      status: 'idea',
      notes: 'Sends automated Google review requests 1 hour after patient check-out.',
    },
  ],
  coach_threads: [
    {
      id: 'thread_1',
      title: 'Twilio setup & A2P 10DLC registration',
      productId: 'prod_1',
      productName: 'TableReady SMS Waitlist',
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now() - 3600000 * 2,
    },
  ],
  coach_messages: [
    {
      id: 'msg_1',
      threadId: 'thread_1',
      role: 'user',
      content: 'Walk me through setting up Twilio for TableReady SMS Waitlist',
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'msg_2',
      threadId: 'thread_1',
      role: 'assistant',
      content:
        "Here is your exact step-by-step Twilio setup for TableReady SMS Waitlist:\n\n1. **Purchase Local Number**: Twilio Console > Phone Numbers > Manage > Buy Number (ensure SMS capability in your client's area code).\n2. **A2P 10DLC Registration**: Under Messaging > Trust Hub > A2P 10DLC, register your Brand and Campaign with clear opt-in description ('Diners opt in at host stand by giving phone number for waitlist notification').\n3. **Set Webhook URL**: In Phone Numbers > Active Numbers > Click number > Under Messaging set 'A Message Comes In' to Webhook (HTTP POST) with your app endpoint.\n4. **Set Auto-Recharge**: Under Billing > Preferences, turn on Auto-Recharge with a $10 threshold so high-volume weekend rush texts never bounce.\n\nTest with your personal phone now before demoing to a restaurant owner.",
      createdAt: Date.now() - 3600000 * 2 + 3000,
    },
  ],
  tasks: [
    {
      id: 'task_1',
      productId: 'prod_1',
      text: 'Register Twilio A2P 10DLC Campaign',
      done: true,
      kind: 'manual',
      createdAt: Date.now() - 3600000 * 20,
    },
    {
      id: 'task_2',
      productId: 'prod_1',
      text: 'Set up Stripe checkout link for $99/mo + $199 setup',
      done: true,
      kind: 'manual',
      createdAt: Date.now() - 3600000 * 18,
    },
    {
      id: 'task_3',
      productId: 'prod_1',
      text: 'Send cold demo video to 10 local pizzerias',
      done: false,
      kind: 'ai',
      createdAt: Date.now() - 3600000 * 10,
    },
  ],
  assets: [
    {
      id: 'asset_1',
      productId: 'prod_1',
      productName: 'TableReady SMS Waitlist',
      recipeId: 'cold-email',
      recipeLabel: 'Cold outreach email',
      text:
        'Hi [First Name],\n\nNoticed Friday nights at your restaurant have 30+ min waits, and walk-ins frequently turn away when they see the crowded entryway.\n\nWe built TableReady — a 2-way SMS waitlist where guests get a text 5 minutes before their table is ready. Restaurants recover 20% more walk-in parties and save front hosts 2+ hours per shift.\n\nOpen to a quick 5-minute look this Thursday to see if it makes sense for your front desk?\n\nBest,\nChris',
      createdAt: Date.now() - 3600000 * 12,
    },
  ],
  followups: [
    {
      id: 'fup_1',
      productId: 'prod_1',
      productName: 'TableReady SMS Waitlist',
      who: 'Tony @ Luigi’s Trattoria',
      note: 'Cold outreach email sent',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      done: false,
    },
  ],
  outreach: [],
  settings: [
    {
      id: 'followup-job',
      jobId: 'created',
    },
  ],
}

function getCollectionData(collection) {
  try {
    const raw = localStorage.getItem(DB_PREFIX + collection)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error('Error reading collection', collection, err)
  }

  // Load seed data if available
  if (SEED_DATA[collection]) {
    const data = SEED_DATA[collection]
    try {
      localStorage.setItem(DB_PREFIX + collection, JSON.stringify(data))
    } catch (e) {}
    return data
  }

  return []
}

function setCollectionData(collection, items) {
  try {
    localStorage.setItem(DB_PREFIX + collection, JSON.stringify(items))
  } catch (err) {
    console.error('Error writing collection', collection, err)
  }
  notifyCollection(collection)
}

function filterAndSort(items, filters = {}, options = {}) {
  let result = [...items]

  // Apply filters
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        result = result.filter((item) => item[key] === val)
      }
    })
  }

  // Apply order
  if (options.order) {
    const isDesc = options.order.startsWith('-')
    const field = isDesc ? options.order.slice(1) : options.order
    result.sort((a, b) => {
      const va = a[field] ?? ''
      const vb = b[field] ?? ''
      if (va < vb) return isDesc ? 1 : -1
      if (va > vb) return isDesc ? -1 : 1
      return 0
    })
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    result = result.slice(0, options.limit)
  }

  return result
}

export const db = {
  async select(collection, filters = {}, options = {}) {
    const items = getCollectionData(collection)
    return filterAndSort(items, filters, options)
  },

  async selectShared(collection, filters = {}, options = {}) {
    return this.select(collection, filters, options)
  },

  async get(collection, id) {
    const items = getCollectionData(collection)
    return items.find((x) => x.id === id) || null
  },

  async getShared(collection, id) {
    return this.get(collection, id)
  },

  async insert(collection, data) {
    const items = getCollectionData(collection)
    const newItem = {
      id: data.id || 'id_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36),
      createdAt: Date.now(),
      ...data,
    }
    items.unshift(newItem)
    setCollectionData(collection, items)
    return newItem
  },

  async insertShared(collection, data) {
    return this.insert(collection, data)
  },

  async update(collection, id, patch) {
    const items = getCollectionData(collection)
    const idx = items.findIndex((x) => x.id === id)
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...patch, updatedAt: Date.now() }
      setCollectionData(collection, items)
      return items[idx]
    }
    return null
  },

  async updateShared(collection, id, patch) {
    return this.update(collection, id, patch)
  },

  async upsertShared(collection, data, id) {
    const targetId = id || data.id
    if (!targetId) return this.insert(collection, data)
    const items = getCollectionData(collection)
    const idx = items.findIndex((x) => x.id === targetId)
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...data, id: targetId, updatedAt: Date.now() }
      setCollectionData(collection, items)
      return items[idx]
    } else {
      const newItem = { id: targetId, createdAt: Date.now(), ...data }
      items.push(newItem)
      setCollectionData(collection, items)
      return newItem
    }
  },

  async delete(collection, id) {
    const items = getCollectionData(collection)
    const filtered = items.filter((x) => x.id !== id)
    setCollectionData(collection, filtered)
    return true
  },

  async deleteShared(collection, id) {
    return this.delete(collection, id)
  },
}
