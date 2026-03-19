import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import TeamsPage from './pages/TeamsPage'
import SchedulePage from './pages/SchedulePage'
import LeaderboardPage from './pages/LeaderboardPage'
import CertificatesPage from './pages/CertificatesPage'
import ResultsPage from './pages/ResultsPage'
import ProfilePage from './pages/ProfilePage'
import QRScannerPage from './pages/QRScannerPage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminEventsPage from './pages/AdminEventsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminResultsPage from './pages/AdminResultsPage'
import AdminViewResultsPage from './pages/AdminViewResultsPage'
import CoordinatorLayout from './layouts/CoordinatorLayout'
import CoordinatorDashboardPage from './pages/CoordinatorDashboardPage'
import CoordinatorEventsPage from './pages/CoordinatorEventsPage'
import CoordinatorResultsPage from './pages/CoordinatorResultsPage'

import { Toaster } from 'react-hot-toast'
import ParticleBackground from './components/ParticleBackground'

function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <ParticleBackground />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
            }
          }}
        />
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Student/Participant Portal */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/scanner" element={<QRScannerPage />} />
        </Route>

        {/* Admin Portal */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/results" element={<AdminResultsPage />} />
          <Route path="/admin/results/view" element={<AdminViewResultsPage />} />
        </Route>

        {/* Coordinator Portal */}
        <Route element={<CoordinatorLayout />}>
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} />
          <Route path="/coordinator/events" element={<CoordinatorEventsPage />} />
          <Route path="/coordinator/results" element={<CoordinatorResultsPage />} />
          <Route path="/coordinator/scanner" element={<QRScannerPage />} />
        </Route>
      </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
