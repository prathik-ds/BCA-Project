import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with dashboard layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventsPage />} />
          <Route path="/teams" element={<ComingSoon title="My Teams" emoji="👥" />} />
          <Route path="/wallet" element={<ComingSoon title="Digital Wallet" emoji="💰" />} />
          <Route path="/schedule" element={<ComingSoon title="Schedule" emoji="📅" />} />
          <Route path="/leaderboard" element={<ComingSoon title="Leaderboard" emoji="🏆" />} />
          <Route path="/certificates" element={<ComingSoon title="Certificates" emoji="📜" />} />
          <Route path="/profile" element={<ComingSoon title="Profile" emoji="👤" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

/* Placeholder for pages not yet built */
function ComingSoon({ title, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold font-display text-white mb-2">{title}</h2>
      <p className="text-gray-500">This page is coming soon.</p>
    </div>
  )
}

export default App
