import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface SyncRule {
  id: string
  name: string
  source: { platform: string; project: string; projectId: string }
  target: { platform: string; project: string; projectId: string }
  trigger: string
  action: string
  direction: string
  status: 'active' | 'paused' | 'error' | 'syncing'
  lastSyncedAt: string
  fieldMappings: { sourceField: string; targetField: string }[]
}

export function useSyncRules() {
  return useQuery<SyncRule[]>({
    queryKey: ['sync-rules'],
    queryFn: async () => {
      const { data } = await api.get('/sync-rules')
      return data
    },
  })
}

export function useCreateSyncRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rule: Omit<SyncRule, 'id' | 'lastSyncedAt'>) =>
      api.post('/sync-rules', rule).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-rules'] }),
  })
}

export function useUpdateSyncRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SyncRule> & { id: string }) =>
      api.patch(`/sync-rules/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-rules'] }),
  })
}

export function useDeleteSyncRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sync-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-rules'] }),
  })
}

export function usePauseSyncRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paused }: { id: string; paused: boolean }) =>
      api.patch(`/sync-rules/${id}`, { status: paused ? 'paused' : 'active' }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-rules'] }),
  })
}
