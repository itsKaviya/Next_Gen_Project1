import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/shared/Sidebar';
import {
  Plus, MapPin, Calendar, Users, TrendingUp, Globe, Compass,
  Clock, Trash2, ChevronRight, BarChart2, Briefcase, Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './DashboardPage.css';

const STATUS_COLORS = {
  planning: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Planning' },
  upcoming: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Upcoming' },
  ongoing: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Ongoing' },
  completed: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Completed' },
};

const PIE_COLORS = ['#5b4fcf', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, analyticsRes] = await Promise.all([
        axios.get('/api/trips'),
        axios.get('/api/trips/analytics/summary')
      ]);
      const all = [...(tripsRes.data.owned || []), ...(tripsRes.data.collaborated || [])];
      setTrips(all);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/trips/${id}`);
      setTrips(t => t.filter(trip => trip._id !== id));
      setDeleteId(null);
    } catch (err) {
      alert('Failed to delete trip');
    }
  };

  const ownedTrips = trips.filter(t => t.owner?._id === user?.id || t.owner === user?.id || !t.owner?._id);
  const collabTrips = trips.filter(t => t.owner?._id && t.owner._id !== user?.id);

  const statusData = Object.entries(STATUS_COLORS).map(([key, val]) => ({
    name: val.label,
    value: trips.filter(t => t.status === key).length,
    color: val.color
  })).filter(d => d.value > 0);

  const monthlyData = trips.reduce((acc, t) => {
    const month = t.createdAt ? new Date(t.createdAt).toLocaleString('default', { month: 'short' }) : 'Jan';
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));

  return (
    <div className="app-layout">
      <Sidebar trips={ownedTrips} />
      <main className="main-content">
        <div className="dashboard-page">
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="dashboard-subtitle">Here's an overview of your travel activity</p>
            </div>
            <Link to="/plan" className="btn btn-primary">
              <Plus size={16} /> Plan New Trip
            </Link>
          </div>

          {/* Tabs */}
          <div className="dashboard-tabs">
            {['overview', 'my trips', 'collaborating'].map(tab => (
              <button key={tab} className={`dash-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="dashboard-loading">
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }}></div>)}
            </div>
          ) : activeTab === 'overview' ? (
            <OverviewTab analytics={analytics} trips={trips} chartData={chartData} statusData={statusData} navigate={navigate} />
          ) : activeTab === 'my trips' ? (
            <TripsTab trips={ownedTrips} onDelete={setDeleteId} navigate={navigate} />
          ) : (
            <TripsTab trips={collabTrips} onDelete={null} navigate={navigate} collab />
          )}
        </div>
      </main>

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="delete-confirm">
              <div className="delete-icon">🗑️</div>
              <h3>Delete this trip?</h3>
              <p>This action cannot be undone. All itinerary and expense data will be lost.</p>
              <div className="delete-actions">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ analytics, trips, chartData, statusData, navigate }) {
  const stats = [
    { icon: Briefcase, label: 'Total Trips', value: analytics?.totalTrips || 0, color: '#5b4fcf' },
    { icon: Globe, label: 'Destinations', value: analytics?.destinations || 0, color: '#ec4899' },
    { icon: Star, label: 'Completed', value: analytics?.completedTrips || 0, color: '#10b981' },
    { icon: Clock, label: 'Upcoming', value: analytics?.upcomingTrips || 0, color: '#f59e0b' },
  ];

  const recentTrips = trips.slice(0, 3);

  return (
    <div className="overview-tab">
      {/* Stats */}
      <div className="stats-grid-dash">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="stat-card-info">
              <div className="stat-card-value">{value}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        {/* Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title"><BarChart2 size={18} /> Trips Over Time</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#5b4fcf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <TrendingUp size={32} />
              <p>No data yet. Plan your first trip!</p>
            </div>
          )}
        </div>

        {/* Status Pie */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title"><Compass size={18} /> Trip Status</h3>
          </div>
          {statusData.length > 0 ? (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {statusData.map(d => (
                  <div key={d.name} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: d.color }}></span>
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty"><Compass size={32} /><p>No trips yet</p></div>
          )}
        </div>
      </div>

      {/* Recent Trips */}
      <div className="card">
        <div className="card-header-row">
          <h3 className="card-section-title">Recent Trips</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => {}}>View All</button>
        </div>
        {recentTrips.length > 0 ? (
          <div className="recent-trips-list">
            {recentTrips.map(trip => (
              <div key={trip._id} className="recent-trip-item" onClick={() => navigate(`/trip/${trip._id}`)}>
                <div className="recent-trip-dest">{trip.destination?.charAt(0)}</div>
                <div className="recent-trip-info">
                  <div className="recent-trip-name">{trip.destination}</div>
                  <div className="recent-trip-meta">
                    <span><Calendar size={12} /> {trip.startDate}</span>
                    <span><Users size={12} /> {trip.passengers} passenger(s)</span>
                  </div>
                </div>
                <div className="recent-trip-status">
                  <span className="badge" style={{ background: STATUS_COLORS[trip.status]?.bg, color: STATUS_COLORS[trip.status]?.color }}>
                    {STATUS_COLORS[trip.status]?.label}
                  </span>
                </div>
                <ChevronRight size={16} className="recent-trip-arrow" />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MapPin size={40} />
            <h3>No trips yet</h3>
            <p>Plan your first adventure with AI</p>
            <Link to="/plan" className="btn btn-primary btn-sm">Plan a Trip</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function TripsTab({ trips, onDelete, navigate, collab }) {
  if (trips.length === 0) {
    return (
      <div className="card empty-state" style={{ padding: 60 }}>
        <MapPin size={48} />
        <h3>{collab ? 'No shared trips' : 'No trips planned yet'}</h3>
        <p>{collab ? 'Join a trip by accepting an invite' : 'Start planning your next adventure!'}</p>
        {!collab && <Link to="/plan" className="btn btn-primary">Plan First Trip ✈️</Link>}
      </div>
    );
  }
  return (
    <div className="trips-grid">
      {trips.map(trip => (
        <TripCard key={trip._id} trip={trip} onDelete={onDelete} onClick={() => navigate(`/trip/${trip._id}`)} />
      ))}
      {!collab && (
        <Link to="/plan" className="add-trip-card">
          <Plus size={28} />
          <span>Plan New Trip</span>
        </Link>
      )}
    </div>
  );
}

function TripCard({ trip, onDelete, onClick }) {
  const status = STATUS_COLORS[trip.status] || STATUS_COLORS.planning;
  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-cover" style={{ background: `linear-gradient(135deg, ${['#5b4fcf','#ec4899','#f59e0b','#10b981','#3b82f6'][Math.floor(Math.random()*5)]}33, #1a1a2e)` }}>
        <span className="trip-card-initial">{trip.destination?.charAt(0)}</span>
        <div className="trip-card-status" style={{ background: status.bg, color: status.color }}>
          {status.label}
        </div>
        {onDelete && (
          <button className="trip-card-delete" onClick={e => { e.stopPropagation(); onDelete(trip._id); }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="trip-card-body">
        <h3 className="trip-card-dest">{trip.destination}</h3>
        <div className="trip-card-meta">
          <span><Calendar size={13} /> {trip.startDate || 'No date'}</span>
          <span><Users size={13} /> {trip.passengers || 1} pax</span>
        </div>
        {trip.themes?.length > 0 && (
          <div className="trip-card-themes">
            {trip.themes.slice(0, 2).map(t => <span key={t} className="trip-theme-tag">{t}</span>)}
          </div>
        )}
        <div className="trip-card-budget">
          {trip.budget?.estimatedMax ? `₹${trip.budget.estimatedMin?.toLocaleString()} – ₹${trip.budget.estimatedMax?.toLocaleString()}` : 'Budget TBD'}
        </div>
      </div>
    </div>
  );
}
