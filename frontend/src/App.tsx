import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import MySyncsPage from '@/pages/MySyncsPage'
import ActivityPage from '@/pages/ActivityPage'
import SettingsPage from '@/pages/SettingsPage'
import SyncSetupWizard from '@/pages/SyncSetupWizard'
import OAuthCallback from '@/pages/OAuthCallback'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/syncs" element={<MySyncsPage />} />
      <Route path="/dashboard/activity" element={<ActivityPage />} />
      <Route path="/dashboard/settings" element={<SettingsPage />} />
      <Route path="/sync/new" element={<SyncSetupWizard />} />
      <Route path="/auth/:platform/callback" element={<OAuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
