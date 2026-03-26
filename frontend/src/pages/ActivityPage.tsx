import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/pages/DashboardPage'
import { timeAgo } from '@/lib/utils'
import api from '@/lib/api'

interface SyncLog {
  id: string
  sourcePlatform: string
  targetPlatform: string
  description: string
  status: 'success' | 'failed' | 'skipped'
  createdAt: string
}

interface SyncLogStats {
  total: number
  success: number
  failed: number
  success_rate: number
}

const ALL_PLATFORMS = ['asana', 'trello', 'monday', 'jira', 'linear']

const STATUS_BADGE: Record<string, 'success' | 'error' | 'neutral'> = {
  success: 'success',
  failed: 'error',
  skipped: 'neutral',
}

export default function ActivityPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')

  if (!isAuthenticated) { navigate('/', { replace: true }); return null }

  const { data: stats } = useQuery<SyncLogStats>({
    queryKey: ['sync-logs-stats'],
    queryFn: () => api.get('/sync-logs/stats').then((r) => r.data),
  })

  const { data, isLoading, isError, refetch } = useQuery<{ items: SyncLog[]; total: number }>({
    queryKey: ['sync-logs', platform, status],
    queryFn: () =>
      api.get('/sync-logs', { params: { ...(platform && { platform }), ...(status && { status }), page_size: 50 } }).then((r) => r.data),
  })

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden md:block"><Sidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="px-4 md:px-8 py-5 border-b border-neutral-200 bg-white">
          <h1 className="text-xl font-semibold text-neutral-900">Activity Log</h1>
          {stats && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-neutral-500">{stats.total} total events</span>
              <span className="text-xs text-green-600">{stats.success} succeeded</span>
              <span className="text-xs text-red-500">{stats.failed} failed</span>
              <span className="text-xs text-neutral-500">{Math.round(stats.success_rate * 100)}% success rate</span>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8">
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="text-sm border border-neutral-200 rounded-md px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All platforms</option>
              {ALL_PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border border-neutral-200 rounded-md px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white animate-pulse">
                  <div className="w-12 h-5 bg-neutral-100 rounded" />
                  <div className="flex-1 h-3.5 bg-neutral-100 rounded w-2/3" />
                  <div className="w-14 h-5 bg-neutral-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-sm text-neutral-700 mb-4">Failed to load activity</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center rounded-xl border border-dashed border-neutral-200">
              <p className="text-sm font-medium text-neutral-700 mb-1">No activity yet</p>
              <p className="text-xs text-neutral-400">Sync events will appear here once your rules run.</p>
            </div>
          )}

          {!isLoading && !isError && data && data.items.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm divide-y divide-neutral-100">
              {data.items.map((log) => (
                <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <PlatformIcon platform={log.sourcePlatform} className="w-4 h-4" />
                    <span className="text-neutral-300 text-xs">→</span>
                    <PlatformIcon platform={log.targetPlatform} className="w-4 h-4" />
                  </div>
                  <p className="flex-1 text-sm text-neutral-700 truncate">{log.description}</p>
                  <Badge variant={STATUS_BADGE[log.status] ?? 'neutral'}>{log.status}</Badge>
                  <span className="text-xs text-neutral-400 flex-shrink-0 hidden sm:block">{timeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
