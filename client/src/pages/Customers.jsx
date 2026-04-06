import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:5001'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Edit State
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name:'', address:'', city:'', gst:'' })

  useEffect(() => {
    fetchCustomers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/customers`, { params: { q: search } })
      setCustomers(res.data)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(c) {
    setEditingId(c._id)
    setEditForm({ name: c.name||'', address: c.address||'', city: c.city||'', gst: c.gst||'' })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ name:'', address:'', city:'', gst:'' })
  }

  async function saveEdit() {
    try {
      if (!editForm.name) return alert('Name is required')
      if (editingId === 'NEW') {
        await axios.post(`${API}/api/customers`, editForm)
      } else {
        await axios.put(`${API}/api/customers/${editingId}`, editForm)
      }
      setEditingId(null)
      fetchCustomers()
    } catch(e) {
      alert('Failed to save customer')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>👥 Manage Customers</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
            View and edit customer details. These are auto-saved during billing.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setSearch('')
            setEditingId('NEW')
            setEditForm({ name:'', address:'', city:'', gst:'' })
          }}
        >
          ➕ Add Customer
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search customers by name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Loading...</div>
        ) : editingId === 'NEW' ? (
          <div style={{ padding: 20, background: 'var(--bg-active)' }}>
            <h3 style={{ marginBottom: 16 }}>New Customer</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
              <div><label className="form-label">Name *</label><input className="form-input" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} /></div>
              <div><label className="form-label">GST No</label><input className="form-input" value={editForm.gst} onChange={e=>setEditForm({...editForm, gst:e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><input className="form-input" value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} /></div>
              <div><label className="form-label">City</label><input className="form-input" value={editForm.city} onChange={e=>setEditForm({...editForm, city:e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-success" onClick={saveEdit}>Save</button>
              <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No customers found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>City</th>
                <th>GST No</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  {editingId === c._id ? (
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div style={{ padding: 20, background: 'var(--bg-active)' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                          <div><label className="form-label">Name *</label><input className="form-input" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} /></div>
                          <div><label className="form-label">GST No</label><input className="form-input" value={editForm.gst} onChange={e=>setEditForm({...editForm, gst:e.target.value})} /></div>
                          <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><input className="form-input" value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} /></div>
                          <div><label className="form-label">City</label><input className="form-input" value={editForm.city} onChange={e=>setEditForm({...editForm, city:e.target.value})} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                          <button className="btn btn-success btn-sm" onClick={saveEdit}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.address || '—'}</td>
                      <td>{c.city || '—'}</td>
                      <td style={{ color: 'var(--accent)' }}>{c.gst || '—'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
