import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Map, Compass, LogOut, Plus, User, ChevronRight, Plane
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'My Trips', path: '/dashboard?tab=trips' },
  { icon: Compass, label: 'Plan New Trip', path: '/plan', highlight: true },
];

export default function Sidebar({ trips = [] }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path) => {
    const basePath = path.split('?')[0];
    return location.pathname === basePath;
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Plane size={20} />
        </div>
        <span className="sidebar-brand-name">TripWise</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Menu</div>
        {NAV_ITEMS.map(({ icon: Icon, label, path, highlight }) => (
          <Link
            key={path}
            to={path}
            className={`sidebar-nav-item ${isActive(path) ? 'active' : ''} ${highlight ? 'highlight' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            {highlight && <span className="sidebar-new-badge">New</span>}
          </Link>
        ))}
      </nav>

      {/* Recent Trips */}
      {trips.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-nav-label">Recent Trips</div>
          {trips.slice(0, 4).map(trip => (
            <Link key={trip._id} to={`/trip/${trip._id}`} className={`sidebar-trip-item ${location.pathname === `/trip/${trip._id}` ? 'active' : ''}`}>
              <div className="sidebar-trip-icon">
                {trip.destination?.charAt(0)?.toUpperCase() || '📍'}
              </div>
              <div className="sidebar-trip-info">
                <span className="sidebar-trip-name">{trip.destination}</span>
                <span className="sidebar-trip-date">{trip.startDate || 'No date'}</span>
              </div>
              <ChevronRight size={14} className="sidebar-trip-arrow" />
            </Link>
          ))}
        </div>
      )}

      {/* Quick plan button */}
      <div className="sidebar-quick">
        <Link to="/plan" className="sidebar-plan-btn">
          <Plus size={16} />
          Plan New Trip
        </Link>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-email">{user?.email}</span>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
