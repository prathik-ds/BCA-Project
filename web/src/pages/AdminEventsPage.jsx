import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Loader2, X, Calendar } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const emptyForm = {
    event_name: '', description: '', category_id: '1', event_type: 'solo', scope: 'intra_college',
    start_datetime: '', end_datetime: '', entry_fee: '0', max_participants: '100', status: 'published'
  };
  const [form, setForm] = useState(emptyForm);
  const [showRegsModal, setShowRegsModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditId(event.event_id);
    setForm({
      event_name: event.event_name || '',
      description: event.description || '',
      category_id: String(event.category_id || '1'),
      event_type: event.event_type || 'solo',
      scope: event.scope || 'intra_college',
      start_datetime: event.start_datetime ? event.start_datetime.substring(0, 16) : '',
      end_datetime: event.end_datetime ? event.end_datetime.substring(0, 16) : '',
      entry_fee: String(event.entry_fee || '0'),
      max_participants: String(event.max_participants || '100'),
      status: event.status || 'published',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const payload = {
      ...form,
      category_id: parseInt(form.category_id),
      entry_fee: parseFloat(form.entry_fee),
      max_participants: parseInt(form.max_participants),
      start_datetime: form.start_datetime.replace('T', ' ') + (form.start_datetime.length === 16 ? ':00' : ''),
      end_datetime: form.end_datetime.replace('T', ' ') + (form.end_datetime.length === 16 ? ':00' : ''),
    };

    try {
      if (editId) {
        await api.put(`/events/${editId}`, payload);
      } else {
        await api.post('/events', payload);
      }
      setShowModal(false);
      loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting event');
    }
  };

  const openRegistrations = async (eventId) => {
    setSelectedEventId(eventId);
    setShowRegsModal(true);
    setLoadingRegs(true);
    try {
      const res = await api.get(`/admin/events/${eventId}/registrations`);
      setRegistrations(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const cancelRegistration = async (regId) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await api.delete(`/registrations/${regId}`);
      // Refresh regs list
      const res = await api.get(`/admin/events/${selectedEventId}/registrations`);
      setRegistrations(res.data.data || []);
      // Also refresh main events list to update counts
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling registration');
    }
  };

  const handleExport = () => {
    if (registrations.length === 0) return;
    
    const headers = ['Name', 'Email', 'College', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      `${r.first_name} ${r.last_name}`,
      r.email,
      r.college_name,
      r.status,
      new Date(r.registered_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_event_${selectedEventId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Calendar className="text-amber-400" size={28}/> Event Control</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} events total</p>
        </div>
        <button onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">
          <Plus size={20} /> Create New Event
        </button>
      </div>

      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={40}/></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="text-gray-600 mx-auto mb-4"/>
            <p className="text-gray-500">No events yet. Click "Create New Event" to get started!</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-900/50 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Event Name</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Registrations</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map(event => (
                <tr key={event.event_id} className="hover:bg-surface-700/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{event.event_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{event.event_type} • {event.category_name || 'General'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(event.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-semibold">{event.registered_count || 0}</span>
                    <span className="text-gray-500">/{event.max_participants || '∞'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      event.status === 'ongoing' ? 'bg-purple-500/20 text-purple-400' :
                      event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {event.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openRegistrations(event.event_id)} className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-xs text-gray-300 hover:text-white transition">Participants</button>
                      <button onClick={() => openEdit(event)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-amber-500 transition"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(event.event_id)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 rounded-2xl max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">{editId ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Event Name *</label>
                <input required name="event_name" value={form.event_name} onChange={handleChange} placeholder="e.g. Code Sprint 2026"
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Description *</label>
                <textarea required name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Describe the event..."
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Start Date & Time *</label>
                  <input required type="datetime-local" name="start_datetime" value={form.start_datetime}
                    onChange={handleChange} className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">End Date & Time *</label>
                  <input required type="datetime-local" name="end_datetime" value={form.end_datetime}
                    onChange={handleChange} className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Event Type</label>
                  <select name="event_type" value={form.event_type} onChange={handleChange}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
                    <option value="solo">Solo</option>
                    <option value="team">Team</option>
                    <option value="workshop">Workshop</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Entry Fee (₹)</label>
                  <input type="number" name="entry_fee" value={form.entry_fee} onChange={handleChange} min="0"
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Max Participants</label>
                  <input type="number" name="max_participants" value={form.max_participants} onChange={handleChange} min="1"
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Scope</label>
                  <select name="scope" value={form.scope} onChange={handleChange}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
                    <option value="intra_college">Intra College</option>
                    <option value="inter_college">Inter College</option>
                    <option value="open">Open</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5">Status</label>
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition">
                    <option value="draft">Draft</option>
                    <option value="published">Published (visible to students)</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-surface-700 text-white rounded-xl hover:bg-surface-600 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : (editId ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-800 rounded-2xl max-w-4xl w-full border border-white/10 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white">Event Participants</h2>
                <button onClick={() => openRegistrations(selectedEventId)} disabled={loadingRegs}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
                  <div className={loadingRegs ? 'animate-spin' : ''}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                  </div>
                </button>
                {registrations.length > 0 && (
                  <button onClick={handleExport}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-bold rounded-lg transition-all ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download CSV
                  </button>
                )}
              </div>
              <button onClick={() => setShowRegsModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingRegs ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber-500" size={32}/></div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No one has registered for this event yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-400 border-b border-white/5">
                      <tr>
                        <th className="pb-3 px-2">Participant</th>
                        <th className="pb-3 px-2">College</th>
                        <th className="pb-3 px-2">Date Registered</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.map(reg => (
                        <tr key={reg.registration_id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-2">
                            <div className="font-bold text-white">{reg.first_name} {reg.last_name}</div>
                            <div className="text-xs text-gray-500">{reg.email}</div>
                          </td>
                          <td className="py-4 px-2 text-gray-400">{reg.college_name}</td>
                          <td className="py-4 px-2 text-gray-400">
                            {new Date(reg.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-4 px-2">
                             <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                               reg.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                               reg.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                               'bg-amber-500/10 text-amber-400'
                             }`}>
                               {reg.status}
                             </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            {reg.status !== 'cancelled' && (
                              <button onClick={() => cancelRegistration(reg.registration_id)}
                                className="text-xs font-bold text-red-500 hover:text-red-400 underline transition">
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
