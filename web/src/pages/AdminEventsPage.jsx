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
      start_datetime: form.start_datetime.length === 16 ? form.start_datetime + ':00' : form.start_datetime,
      end_datetime: form.end_datetime.length === 16 ? form.end_datetime + ':00' : form.end_datetime,
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
    </div>
  );
}
