import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PlatformIcon } from '@/components/ui/PlatformIcon'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useConnectedPlatforms } from '@/hooks/usePlatforms'
import { Sidebar } from '@/pages/DashboardPage'
import api from '@/lib/api'

const ALL_PLATFORMS = ['asana', 'trello', 'monday', 'jira', 'linear']
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export default function SettingsPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: platforms, isLoading } = useConnectedPlatforms()

  const { mutate: disconnect, variables: disconnecting } = useMutation({
    mutationFn: (platform: string) => api.delete(`/auth/${platform}/disconnect`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platforms'] }),
  })

  if (!isAuthenticated) { navigate('/', { replace: true }); return null }

  const platformMap = new Map(platforms?.map((p) => [p.platform, p]) ?? [])

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden md:block"><Sidebar /></div>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="px-4 md:px-8 py-5 border-b border-neutral-200 bg-white">
          <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-2xl space-y-8">
          {/* Account */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Account</h2>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Name</span>
                <span className="text-sm text-neutral-700">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Email</span>
                <span className="text-sm text-neutral-700">{user?.email}</span>
              </div>
            </div>
          </section>

          {/* Connected platforms */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Connected Platforms</h2>
            {isLoading ? (
              <div className="space-y-2">
                {ALL_PLATFORMS.map((p) => (
                  <div key={p} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-white animate-pulse">
                    <div className="w-6 h-6 rounded bg-neutral-100" />
                    <div className="flex-1 h-3.5 bg-neutral-100 rounded w-1/3" />
                    <div className="w-20 h-7 bg-neutral-100 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100 overflow-hidden">
                {ALL_PLATFORMS.map((pid) => {
                  const info = platformMap.get(pid)
                  const isConnected = info?.status === 'connected'
                  const isError = info?.status === 'error'
                  const isDisconnecting = disconnecting === pid

                  return (
                    <div key={pid} className="flex items-center gap-3 px-4 py-3">
                      <PlatformIcon platform={pid} className="w-6 h-6 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 capitalize">{pid}</p>
                        {info?.workspace && (
                          <p className="text-xs text-neutral-400 truncate">{info.workspace}</p>
                        )}
                      </div>
                      {isError && (
                        <Badge variant="error"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>
                      )}
                      {isConnected ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={isDisconnecting}
                          onClick={() => disconnect(pid)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.location.href = `${API_URL}/auth/${pid}/connect`}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
