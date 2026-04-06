import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Dashboard',      icon: '📊' },
  { to: '/create',    label: 'Create Bill',    icon: '🧾' },
  { to: '/bills',     label: 'Previous Bills', icon: '📋' },
  { to: '/customers', label: 'Customers',      icon: '👥' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2>⚡ Soham Research</h2>
          <button className="show-mobile" onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:20, padding:0 }}>✕</button>
        </div>
        <p>& Marketing Pvt. Ltd.</p>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
          >
            <span className="nav-icon">{l.icon}</span>
            <span className="nav-text">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        GST No: 27AANCS2167G1Z3
      </div>
    </aside>
  )
}
