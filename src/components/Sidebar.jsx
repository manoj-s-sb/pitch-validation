import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, Settings } from 'lucide-react';

const navItems = [
  { id: 'noc', path: '/noc', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'pitch', path: '/pitchValidation', icon: Target, label: 'Pitch Validation' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = location.pathname;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">NOC</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePath.startsWith(item.path);
          return (
            <button
              key={item.id}
              className={`sidebar-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              <item.icon size={20} strokeWidth={1.8} />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-btn" title="Settings">
          <Settings size={20} strokeWidth={1.8} />
          <span className="sidebar-label">Settings</span>
        </button>
      </div>
    </aside>
  );
}
