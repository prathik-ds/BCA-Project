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
      </Routes>
    </BrowserRouter>
  )
}

export default App
