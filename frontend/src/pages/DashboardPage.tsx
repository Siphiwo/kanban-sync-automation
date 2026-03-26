import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard, RefreshCw, Activity, Settings, LogOut,
  ArrowLeftRight, Pause, Settings2, AlertCircle, Plus, Plug,
  ChevronRight, Menu, X, Play,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { useAuth } from '@/hooks/useAuth'
import { useSyncRules, usePauseSyncRule } from '@/hooks/useSyncRules'
import { useConnectedPlatforms } from '@/hooks/usePlatforms'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { cn, timeAgo } from '@/lib/utils'

const ALL_PLATFORMS = ['asana', 'trello', 'monday', 'jira', 'linear']

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Mock activity for demo
const MOCK_ACTIVITY = [
  { id: '1', type: 'success', description: 'Task "Fix login bug" synced from Asana → Trello', createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: '2', type: 'success', description: 'Status update synced: "In Progress" → "Doing"', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '3', type: 'warning', description: 'Sync paused: Trello token expired', createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: '4', type: 'success', description: 'New sync rule created: Jira → Linear', createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/syncs', icon: RefreshCw, label: 'My Syncs' },
    { to: '/dashboard/activity', icon: Activity, label: 'Activity Log' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col bg-neutral-50 border-r border-neutral-200 py-4 px-3">
      <div className="flex items-center gap-2 px-3 py-2 mb-4">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M8 14C8 10.686 10.686 8 14 8" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20 14C20 17.314 17.314 20 14 20" stroke="#4f6ef7" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M14 8L17 5M14 8L11 5" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 20L11 23M14 20L17 23" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-semibold text-neutral-900 text-sm">Kanban Sync</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 rounded text-neutral-400 hover:text-neutral-700" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-neutral-200 pt-3 mt-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-600">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="text-sm text-neutral-700 truncate flex-1">{user?.name ?? user?.email}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function PlatformCards() {
  const { data: connected, isLoading } = useConnectedPlatforms()

  const platformMap = new Map(connected?.map((p) => [p.platform, p]) ?? [])

  if (isLoading) {
    return (
      <div className="flex gap-3 flex-wrap mb-6">
        {ALL_PLATFORMS.map((p) => (
          <div key={p} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 min-w-[180px] flex-1 animate-pulse">
            <div className="w-7 h-7 rounded-md bg-neutral-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-neutral-100 rounded w-2/3" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-3 flex-wrap mb-6 overflow-x-auto pb-1">
      {ALL_PLATFORMS.map((pid) => {
        const info = platformMap.get(pid)
        const status = info?.status ?? 'disconnected'
        const isError = status === 'error'
        const isConnected = status === 'connected'

        return (
          <a
            key={pid}
            href={isConnected ? undefined : `${API_URL}/auth/${pid}/connect`}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border shadow-sm min-w-[180px] flex-1 transition-all duration-200 hover:shadow-md cursor-pointer',
              isError ? 'border-red-200 bg-red-50/30' : isConnected ? 'bg-white border-neutral-200' : 'bg-white border-dashed border-neutral-200'
            )}
          >
            <PlatformIcon platform={pid} className="w-7 h-7 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate capitalize">{pid}</p>
              <p className="text-xs text-neutral-400 truncate">
                {isError ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Reconnect required
                  </span>
                ) : info?.workspace ?? 'Not connected'}
              </p>
            </div>
            <span className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isConnected ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-neutral-300'
            )} />
          </a>
        )
      })}
    </div>
  )
}

function SyncRow({ sync }: { sync: ReturnType<typeof useSyncRules>['data'] extends (infer T)[] | undefined ? T : never }) {
  const { mutate: pause } = usePauseSyncRule()
  const shouldReduce = useReducedMotion()

  const statusBadge: Record<string, { variant: 'success' | 'warning' | 'error' | 'brand'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    paused: { variant: 'warning', label: 'Paused' },
    error: { variant: 'error', label: 'Error' },
    syncing: { variant: 'brand', label: 'Syncing…' },
  }
  const badge = statusBadge[sync.status] ?? statusBadge.active

  return (
    <motion.div
      variants={shouldReduce ? {} : fadeUp}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <PlatformIcon platform={sync.source.platform} className="w-5 h-5" />
        <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-300" />
        <PlatformIcon platform={sync.target.platform} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{sync.name}</p>
        <p className="text-xs text-neutral-400 truncate">{sync.source.project} → {sync.target.project}</p>
      </div>
      <p className="text-xs text-neutral-400 flex-shrink-0 hidden sm:block">{timeAgo(sync.lastSyncedAt)}</p>
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); pause({ id: sync.id, paused: sync.status !== 'paused' }) }}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label={sync.status === 'paused' ? 'Resume sync' : 'Pause sync'}
        >
          {sync.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); /* open edit */ }}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Edit sync"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function ActivityFeed() {
  return (
    <aside className="w-80 flex-shrink-0 border-l border-neutral-200 pl-6 hidden lg:block">
      <h2 className="text-base font-semibold text-neutral-900 mb-4">Recent Activity</h2>
      <div className="space-y-1">
        {MOCK_ACTIVITY.map((event, i) => (
          <div key={event.id} className="flex gap-3 py-2.5">
            <div className="flex flex-col items-center pt-1">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                event.type === 'success' ? 'bg-green-500' : event.type === 'error' ? 'bg-red-500' : 'bg-amber-400'
              )} />
              {i < MOCK_ACTIVITY.length - 1 && <div className="w-px flex-1 bg-neutral-100 mt-1" />}
            </div>
            <div className="pb-2 min-w-0">
              <p className="text-xs text-neutral-700 leading-relaxed">{event.description}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(event.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: syncs, isLoading, isError, error, refetch } = useSyncRules()
  const { data: platforms } = useConnectedPlatforms()
  const shouldReduce = useReducedMotion()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (!isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const activeCount = syncs?.filter((s) => s.status === 'active').length ?? 0
  const disconnectedPlatforms = platforms?.filter((p) => p.status !== 'connected') ?? []

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <Sidebar onClose={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-400 mt-0.5">{activeCount} active sync{activeCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => navigate('/sync/new')} size="sm">
            <Plus className="w-3.5 h-3.5" /> New sync
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {/* Platform connection cards */}
          <PlatformCards />

          {/* Quick actions */}
          {(disconnectedPlatforms.length > 0 || (syncs && syncs.length === 0)) && (
            <div className="flex gap-3 flex-wrap mb-6">
              {disconnectedPlatforms.length > 0 && (
                <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 text-left hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 group">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                    <Plug className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Connect a platform</p>
                    <p className="text-xs text-neutral-500">{disconnectedPlatforms.length} platform{disconnectedPlatforms.length !== 1 ? 's' : ''} not connected</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              {syncs?.length === 0 && (
                <button
                  onClick={() => navigate('/sync/new')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 text-left hover:bg-brand-50 hover:border-brand-300 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-200 transition-colors">
                    <Plus className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Create your first sync</p>
                    <p className="text-xs text-neutral-500">Takes about 2 minutes</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-6">
            {/* Active syncs */}
            <section className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-neutral-900">Active Syncs</h2>
                <Button variant="ghost" size="sm">View all</Button>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 animate-pulse">
                      <div className="w-12 h-5 bg-neutral-100 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-neutral-100 rounded w-1/3" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                      </div>
                      <div className="w-14 h-5 bg-neutral-100 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center py-12 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                  <p className="text-sm text-neutral-700 mb-1">Failed to load syncs</p>
                  <p className="text-xs text-neutral-400 mb-4">{(error as Error)?.message}</p>
                  <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
                </div>
              )}

              {!isLoading && !isError && syncs?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <ArrowLeftRight className="w-5 h-5 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">No syncs yet</p>
                  <p className="text-xs text-neutral-400 mb-4 max-w-xs">Connect two platforms and describe what you want to sync.</p>
                  <Button size="sm" onClick={() => navigate('/sync/new')}>Create your first sync</Button>
                </div>
              )}

              {!isLoading && !isError && syncs && syncs.length > 0 && (
                <motion.div
                  variants={shouldReduce ? {} : staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {syncs.map((sync) => (
                    <SyncRow key={sync.id} sync={sync} />
                  ))}
                </motion.div>
              )}
            </section>

            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  )
}
