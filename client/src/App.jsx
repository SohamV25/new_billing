import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CreateBill from './pages/CreateBill'
import PreviousBills from './pages/PreviousBills'
import BillPreview from './pages/BillPreview'
import Customers from './pages/Customers'
import { useState } from 'react'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <h1 title="Billing Dashboard">Billing Dashboard</h1>
          </div>
          <span className="header-date">{today}</span>
        </header>

        <main className="page-body">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/create"    element={<CreateBill />} />
            <Route path="/bills"     element={<PreviousBills />} />
            <Route path="/bills/:id" element={<BillPreview />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
