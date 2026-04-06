import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:5001'

export default function PreviousBills() {
  const navigate = useNavigate()
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo  ] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.append('q', search)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo)   params.append('dateTo',   dateTo)
      const res = await axios.get(`${API}/api/bills?${params.toString()}`)
      setBills(res.data)
    } catch { setBills([]) }
    finally  { setLoading(false) }
  }, [search, dateFrom, dateTo])

  useEffect(() => { fetchBills() }, [fetchBills])

  function handleDeleteClick(id) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await axios.delete(`${API}/api/bills/${deletingId}`)
      fetchBills()
    } catch(e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700 }}>📋 Previous Bills</h2>
          <p style={{ color:'var(--text-dim)', fontSize:12, marginTop:3 }}>{bills.length} bill{bills.length!==1?'s':''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create')}>➕ New Bill</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20, padding:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:12, alignItems:'end' }}>
          <div>
            <label className="form-label">Search by Buyer Name or Bill No.</label>
            <input className="form-input" placeholder="e.g. Panchasheel or 123" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Date From</label>
            <input className="form-input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Date To</label>
            <input className="form-input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-ghost" onClick={()=>{ setSearch(''); setDateFrom(''); setDateTo('') }}>
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflowX:'auto' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--text-dim)' }}>Loading...</div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No bills found. Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bill No.</th>
                <th>Buyer</th>
                <th>Bill Date</th>
                <th>Created</th>
                <th>Before Tax</th>
                <th>Total GST</th>
                <th style={{ color:'var(--accent)' }}>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b, i) => {
                const gst = (parseFloat(b.totalCGST)||0) + (parseFloat(b.totalSGST)||0) + (parseFloat(b.totalIGST)||0)
                return (
                  <tr key={b._id}>
                    <td style={{ color:'var(--text-dim)' }}>{i+1}</td>
                    <td><span className="badge badge-blue">{b.billNo || '—'}</span></td>
                    <td style={{ fontWeight:600, maxWidth:200 }}>{b.to}</td>
                    <td style={{ color:'var(--text-muted)' }}>{b.billDate || '—'}</td>
                    <td style={{ color:'var(--text-dim)', fontSize:12 }}>{fmtDate(b.createdAt)}</td>
                    <td>₹ {parseFloat(b.totalBeforeTax).toFixed(2)}</td>
                    <td style={{ color:'var(--warning)' }}>₹ {gst.toFixed(2)}</td>
                    <td style={{ color:'var(--accent)', fontWeight:700, fontSize:15 }}>₹ {parseFloat(b.totalAfterTax).toFixed(2)}</td>
                    <td>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/bills/${b._id}`)}>👁 View</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDeleteClick(b._id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {deletingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 400, maxWidth: '90%', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Delete Bill</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>Are you absolutely sure you want to delete this bill? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
