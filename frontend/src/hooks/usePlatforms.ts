import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface ConnectedPlatform {
  platform: string
  workspace: string
  connected: boolean
  status: 'connected' | 'disconnected' | 'error'
}

export interface Project {
  id: string
  name: string
}

export interface ProjectField {
  id: string
  name: string
  type: string
}

export function useConnectedPlatforms() {
  return useQuery<ConnectedPlatform[]>({
    queryKey: ['platforms'],
    queryFn: async () => {
      const { data } = await api.get('/platforms')
      return data
    },
  })
}

export function useProjects(platform: string) {
  return useQuery<Project[]>({
    queryKey: ['projects', platform],
    queryFn: async () => {
      const { data } = await api.get(`/platforms/${platform}/projects`)
      return data
    },
    enabled: !!platform,
  })
}

export function useProjectFields(platform: string, projectId: string) {
  return useQuery<ProjectField[]>({
    queryKey: ['fields', platform, projectId],
    queryFn: async () => {
      const { data } = await api.get(`/platforms/${platform}/projects/${projectId}/fields`)
      return data
    },
    enabled: !!platform && !!projectId,
  })
}
