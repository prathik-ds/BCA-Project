import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import TeamsPage from './pages/TeamsPage'
import WalletPage from './pages/WalletPage'
import SchedulePage from './pages/SchedulePage'
import LeaderboardPage from './pages/LeaderboardPage'
import CertificatesPage from './pages/CertificatesPage'
import ProfilePage from './pages/ProfilePage'
import QRScannerPage from './pages/QRScannerPage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with dashboard layout */}
        <Route element={<DashboardLayout />}>
          {/* ── Participant Portal ── */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* ── Coordinator Tools ── */}
          <Route path="/scanner" element={<QRScannerPage />} />
        </Route>

        {/* ── Admin Portal ── */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminDashboardPage />} />
          <Route path="/admin/events" element={<AdminDashboardPage />} />
          <Route path="/admin/finance" element={<AdminDashboardPage />} />
          <Route path="/admin/reports" element={<AdminDashboardPage />} />
          <Route path="/admin/announcements" element={<AdminDashboardPage />} />
          <Route path="/admin/logs" element={<AdminDashboardPage />} />
          <Route path="/admin/settings" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
