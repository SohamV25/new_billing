import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const API = 'http://localhost:5001'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
        <p style={{ fontWeight:700, marginBottom:4 }}>{label}</p>
        <p style={{ color:'var(--accent)' }}>Revenue: ₹{payload[0]?.value?.toFixed(2)}</p>
        <p style={{ color:'var(--success)' }}>Bills: {payload[1]?.value}</p>
      </div>
    )
  }
  return null
}

function todayYYYYMMDD() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats]   = useState({ total:0, revenue:0, thisMonth:0, customers:0 })
  const [chartData, setChartData] = useState([])
  const [recentBills, setRecentBills] = useState([])
  const [detailedStats, setDetailedStats] = useState({ customers:[], products:[] })
  
  // Date filter for detailed analytics
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (dateRange.from) params.append('dateFrom', dateRange.from)
        if (dateRange.to)   params.append('dateTo', dateRange.to)

        const [billsRes, analyticsRes, customersRes, detailedRes] = await Promise.all([
          axios.get(`${API}/api/bills`),
          axios.get(`${API}/api/bills/analytics/monthly`),
          axios.get(`${API}/api/customers`),
          axios.get(`${API}/api/bills/analytics/detailed?${params.toString()}`)
        ])

        const bills = billsRes.data
        const now   = new Date()
        const thisMonthRevenue = bills
          .filter(b => {
            const d = new Date(b.createdAt)
            return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear()
          })
          .reduce((sum,b) => sum + (parseFloat(b.totalAfterTax)||0), 0)

        const totalRevenue = bills.reduce((sum,b) => sum + (parseFloat(b.totalAfterTax)||0), 0)

        setStats({
          total:      bills.length,
          revenue:    totalRevenue,
          thisMonth:  thisMonthRevenue,
          customers:  customersRes.data.length,
        })

        // Build chart data (last 8 months)
        const chart = analyticsRes.data.slice(-8).map(d => ({
          name:    `${MONTHS[d._id.month-1]} ${d._id.year}`,
          revenue: parseFloat(d.totalRevenue.toFixed(2)),
          bills:   d.billCount,
        }))
        setChartData(chart)
        setRecentBills(bills.slice(0,5))
        setDetailedStats({ customers: detailedRes.data.customerStats, products: detailedRes.data.productStats })

      } catch(e) {
        console.error('Dashboard load error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange.from, dateRange.to])

  if (loading) return (
    <div style={{ textAlign:'center', padding:80, color:'var(--text-dim)' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
      <p>Loading dashboard...</p>
    </div>
  )

  const statCards = [
    { label:'Total Bills',       value: stats.total,                    icon:'🧾', color:'var(--accent)',   sub:'All time' },
    { label:'Total Revenue',     value:`₹${stats.revenue.toFixed(0)}`,  icon:'💰', color:'var(--success)',  sub:'All time' },
    { label:'This Month',        value:`₹${stats.thisMonth.toFixed(0)}`, icon:'📅', color:'var(--warning)', sub:'Current month' },
    { label:'Customers DB',      value: stats.customers,                 icon:'🏥', color:'#a78bfa',        sub:'In database' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Stat Cards */}
      <div className="grid-4">
        {statCards.map(s => (
          <div className="stat-card" key={s.label} style={{ '--accent':s.color }}>
            <div style={{ fontSize:28 }}>{s.icon}</div>
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color:s.color }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>

        {/* Monthly Revenue Chart */}
        <div className="card">
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:20, color:'var(--text-main)' }}>📈 Monthly Revenue &amp; Bill Count</h3>
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ padding:40 }}>
              <div className="empty-icon">📊</div>
              <p>No data yet. Generate your first bill!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top:5, right:20, left:10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false}
                  tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill:'var(--text-dim)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize:12, color:'var(--text-muted)' }} />
                <Bar yAxisId="left"  dataKey="revenue" name="Revenue (₹)" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="bills"   name="Bills"       fill="#34d399" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text-muted)' }}>Quick Actions</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={()=>navigate('/create')}>
                🧾 Create New Bill
              </button>
              <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }} onClick={()=>navigate('/bills')}>
                📋 View All Bills
              </button>
            </div>
          </div>

          <div className="card" style={{ background:'var(--bg-body)' }}>
            <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:'var(--text-dim)', textTransform:'uppercase' }}>Company Info</h3>
            <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.8 }}>
              <div><b style={{ color:'var(--text-main)' }}>Soham Research & Marketing Pvt. Ltd.</b></div>
              <div>Chhatrapati Sambhajinagar, Maharashtra - 431003</div>
              <div style={{ marginTop:4, color:'var(--accent)', fontSize:10 }}>GST: 27AANCS2167G1Z3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Section */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize:14, fontWeight:700 }}>🔍 Detailed Analytics</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Filter by Date:</span>
            <input type="date" className="form-input" style={{ width: 140, padding: '4px 8px', fontSize: 12 }} 
                   value={dateRange.from} onChange={e => setDateRange(p => ({...p, from: e.target.value}))} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>to</span>
            <input type="date" className="form-input" style={{ width: 140, padding: '4px 8px', fontSize: 12 }} 
                   value={dateRange.to} onChange={e => setDateRange(p => ({...p, to: e.target.value}))} />
            <button className="btn btn-ghost btn-sm" onClick={() => setDateRange({from:'', to:''})}>Clear</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 1 }}>
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <div style={{ padding: '12px 20px', background: 'var(--bg-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>🏆 Top Products</div>
            {detailedStats.products.length === 0 ? <div style={{ padding: 20, color: 'var(--text-dim)', fontSize: 12 }}>No product data for this period</div> : (
              <table className="data-table">
                <thead><tr><th>Product Name</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {detailedStats.products.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p._id}</td>
                      <td>{p.unitsSold}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <div style={{ padding: '12px 20px', background: 'var(--bg-body)', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>🌟 Top Customers</div>
            {detailedStats.customers.length === 0 ? <div style={{ padding: 20, color: 'var(--text-dim)', fontSize: 12 }}>No customer data for this period</div> : (
              <table className="data-table">
                <thead><tr><th>Buyer</th><th>Bills</th><th>Revenue</th></tr></thead>
                <tbody>
                  {detailedStats.customers.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c._id}</td>
                      <td>{c.billCount}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>₹{c.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="card" style={{ padding:0 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:14, fontWeight:700 }}>🕐 Recent Bills</h3>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/bills')}>View All</button>
        </div>
        {recentBills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No bills yet. Create one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Bill No.</th>
                <th>Bill Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentBills.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight:600 }}>{b.to}</td>
                  <td><span className="badge badge-blue">{b.billNo || '—'}</span></td>
                  <td style={{ color:'var(--text-muted)', fontSize:12 }}>{b.billDate || '—'}</td>
                  <td style={{ color:'var(--accent)', fontWeight:700 }}>₹ {parseFloat(b.totalAfterTax).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/bills/${b._id}`)}>View</button>
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
