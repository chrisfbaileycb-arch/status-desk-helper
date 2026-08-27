import { NavLink, useLocation } from 'react-router-dom'
import { MessageCircle, LayoutGrid, Zap } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Cole', icon: MessageCircle },
  { to: '/workflows', label: 'Workflows', icon: Zap },
  { to: '/portfolio', label: 'Portfolio', icon: LayoutGrid },
]

export default function Nav() {
  const { pathname } = useLocation()
  const productDetail = pathname.startsWith('/portfolio/')

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom,0px)] bg-[#fffaf2]/95 backdrop-blur-xl border-t border-[#3d2f24]/12">
        <div className="flex items-stretch justify-around px-2 py-2">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl min-w-[64px] transition-colors ${
                  isActive || (to === '/portfolio' && productDetail) ? 'text-primary' : 'text-[#3d2f24]/45'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive || (to === '/portfolio' && productDetail) ? 2.4 : 2} />
                  <span className="text-[11px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-[#3d2f24]/12 bg-[#fffaf2] px-4 py-6">
        <div className="font-display font-black text-2xl text-[#3d2f24] mb-10 px-2">
          ECHO<span className="text-primary">DESK</span>
        </div>
        <div className="flex flex-col gap-1">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive || (to === '/portfolio' && productDetail)
                    ? 'bg-primary/10 text-primary border border-primary/25'
                    : 'text-[#3d2f24]/60 hover:text-[#3d2f24] hover:bg-[#3d2f24]/[0.05]'
                }`
              }
            >
              <Icon size={19} />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
        <p className="mt-auto px-2 text-[11px] text-[#3d2f24]/40 leading-relaxed">
          Your personal sales & deployment advisor — not customer-facing.
        </p>
      </aside>
    </>
  )
}
