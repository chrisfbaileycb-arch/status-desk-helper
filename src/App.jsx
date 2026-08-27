import { useEffect, useRef, useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { auth } from './lib/auth'
import Nav from './components/Nav'
import Assistant from './pages/Assistant'
import Portfolio from './pages/Portfolio'
import Workflows from './pages/Workflows'
import ProductDetail from './pages/ProductDetail'
import { Sparkles } from 'lucide-react'

function ScrollReset({ scrollRef }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [pathname])
  return null
}

function SignInGate() {
  return (
    <div
      className="h-full w-full flex items-center justify-center px-6"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, rgba(196,92,52,0.18), rgba(248,240,229,1) 62%)',
      }}
    >
      <div className="max-w-sm w-full text-center anim-fadeup">
        <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/25 flex items-center justify-center anim-glow">
          <Sparkles className="text-primary" size={32} />
        </div>
        <h1 className="font-display font-black text-4xl text-[#3d2f24] mb-2">
          ECHO<span className="text-primary">DESK</span>
        </h1>
        <p className="text-[#3d2f24]/65 text-sm mb-8 leading-relaxed">
          Your personal advisor for shipping and selling your own products — deployment checklists, Twilio setup help, and sales scripts, all in one place.
        </p>
        <button
          onClick={() => auth.signIn()}
          className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          Sign in to continue
        </button>
      </div>
    </div>
  )
}

function AppBody() {
  const scrollRef = useRef(null)
  const { pathname } = useLocation()
  const isChat = pathname === '/'

  return (
    <div className="h-full flex bg-[rgb(var(--color-bg))]">
      <Nav />
      <main
        ref={scrollRef}
        className={`flex-1 min-w-0 h-full overflow-y-auto md:pb-0 ${isChat ? 'pb-0' : 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'}`}
      >
        <ScrollReset scrollRef={scrollRef} />
        <Routes>
          <Route path="/" element={<Assistant />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<ProductDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(auth.getCurrentUser())

  useEffect(() => {
    const unsub = auth.onAuthChange(setUser)
    return unsub
  }, [])

  if (!user) return <SignInGate />

  return (
    <HashRouter>
      <AppBody />
    </HashRouter>
  )
}
