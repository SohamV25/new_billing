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
        <h2>⚡ Soham Research</h2>
        <p>& Marketing Pvt. Ltd.</p>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        GST No: 27AANCS2167G1Z3
      </div>
    </aside>
  )
}
