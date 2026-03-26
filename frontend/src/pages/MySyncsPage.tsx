import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Pause, Play, Trash2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { useAuth } from '@/hooks/useAuth'
import { useSyncRules, usePauseSyncRule, useDeleteSyncRule } from '@/hooks/useSyncRules'
import { Sidebar } from '@/pages/DashboardPage'
import { timeAgo } from '@/lib/utils'

const STATUS_BADGE: Record<string, { variant: 'success' | 'warning' | 'error' | 'brand'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  error: { variant: 'error', label: 'Error' },
  syncing: { variant: 'brand', label: 'Syncing…' },
}

export default function MySyncsPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: syncs, isLoading, isError, refetch } = useSyncRules()
  const { mutate: pause } = usePauseSyncRule()
  const { mutate: del } = useDeleteSyncRule()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isAuthenticated) { navigate('/', { replace: true }); return null }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    del(id, { onSettled: () => setDeletingId(null) })
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden md:block"><Sidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-neutral-200 bg-white">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">My Syncs</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{syncs?.length ?? 0} sync rule{syncs?.length !== 1 ? 's' : ''}</p>
          </div>
          <Button size="sm" onClick={() => navigate('/sync/new')}><Plus className="w-3.5 h-3.5" /> New sync</Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white animate-pulse">
                  <div className="w-12 h-5 bg-neutral-100 rounded" />
                  <div className="flex-1 space-y-2"><div className="h-3.5 bg-neutral-100 rounded w-1/3" /><div className="h-3 bg-neutral-100 rounded w-1/2" /></div>
                  <div className="w-14 h-5 bg-neutral-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-sm text-neutral-700 mb-4">Failed to load syncs</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
          )}

          {!isLoading && !isError && syncs?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-700 mb-1">No syncs yet</p>
              <p className="text-xs text-neutral-400 mb-4">Create your first sync rule to get started.</p>
              <Button size="sm" onClick={() => navigate('/sync/new')}>Create sync</Button>
            </div>
          )}

          {!isLoading && !isError && syncs && syncs.length > 0 && (
            <div className="space-y-2">
              {syncs.map((sync) => {
                const badge = STATUS_BADGE[sync.status] ?? STATUS_BADGE.active
                return (
                  <div key={sync.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 group">
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => pause({ id: sync.id, paused: sync.status !== 'paused' })}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        aria-label={sync.status === 'paused' ? 'Resume' : 'Pause'}
                      >
                        {sync.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(sync.id)}
                        disabled={deletingId === sync.id}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        aria-label="Delete sync"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
