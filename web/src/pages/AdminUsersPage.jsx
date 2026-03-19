import { useState, useEffect } from 'react'
import { Users, Loader2, Search } from 'lucide-react'
import api from '../api/axios'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return (u.first_name + ' ' + u.last_name).toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users className="text-amber-400" size={28}/> Participants</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-700/50 border border-white/5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/30 transition" />
      </div>

      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40}/></div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No users found.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-900/50 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">College</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(user => (
                <tr key={user.user_id} className="hover:bg-surface-700/30 transition">
                  <td className="px-6 py-4 font-medium text-white">{user.first_name} {user.last_name}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.college_code || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      user.role === 'super_admin' ? 'bg-red-500/20 text-red-400' :
                      user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                      user.role === 'coordinator' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
