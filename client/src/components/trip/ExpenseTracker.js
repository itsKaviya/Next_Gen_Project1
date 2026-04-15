import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Filter, TrendingUp, ShoppingBag, Utensils, Bus, Hotel, Activity, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ExpenseTracker.css';

const CATEGORIES = ['food','transport','accommodation','activities','shopping','health','other'];
const CAT_ICONS = { food: Utensils, transport: Bus, accommodation: Hotel, activities: Activity, shopping: ShoppingBag, health: '❤️', other: MoreHorizontal };
const CAT_COLORS = { food: '#ec4899', transport: '#f59e0b', accommodation: '#5b4fcf', activities: '#10b981', shopping: '#3b82f6', health: '#ef4444', other: '#6b7280' };

export default function ExpenseTracker({ tripId, trip, user, currency }) {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ forWhat: '', whoSpentName: '', category: 'food', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => { fetchExpenses(); }, [tripId]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`/api/expenses/trip/${tripId}`);
      setExpenses(res.data.expenses);
      setAnalytics(res.data.analytics);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses', { ...form, tripId, amount: Number(form.amount) });
      setForm({ forWhat: '', whoSpentName: '', category: 'food', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setShowAdd(false);
      fetchExpenses();
    } catch (err) { alert('Failed to add expense'); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      fetchExpenses();
    } catch { alert('Cannot delete this expense'); }
  };

  const filtered = filter ? expenses.filter(e => e.category === filter) : expenses;

  const pieData = Object.entries(analytics?.byCategory || {}).map(([cat, amt]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1), value: amt, color: CAT_COLORS[cat]
  }));

  return (
    <div className="expense-tracker animate-fadeIn">
      <div className="expense-header">
        <h2 className="expense-title">Expenses</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add a New Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="expense-summary-grid">
        <div className="expense-summary-card primary">
          <div className="esc-label">Total Expense</div>
          <div className="esc-value">{currency}{analytics?.totalAmount?.toLocaleString() || '0'}</div>
          <div className="esc-sub">total spent on the plan</div>
        </div>
        <div className="expense-summary-card">
          <div className="esc-label">Most Spent Category</div>
          <div className="esc-value">{currency}{Math.max(0, ...Object.values(analytics?.byCategory || {})).toLocaleString()}</div>
          <div className="esc-cat">
            {Object.entries(analytics?.byCategory || {}).sort(([,a],[,b]) => b-a)[0] ? (
              <span style={{ color: CAT_COLORS[Object.entries(analytics.byCategory).sort(([,a],[,b])=>b-a)[0][0]] }}>
                🍽 {Object.entries(analytics.byCategory).sort(([,a],[,b])=>b-a)[0][0].toUpperCase()}
              </span>
            ) : '-'}
          </div>
        </div>
        <div className="expense-summary-card">
          <div className="esc-label">Highest Single Expense</div>
          <div className="esc-value">{currency}{Math.max(0, ...expenses.map(e => e.amount)).toLocaleString()}</div>
          <div className="esc-sub">
            {expenses.length > 0 ? `spent on 🍽 ${expenses.reduce((a,b)=>a.amount>b.amount?a:b,{amount:0})?.category || ''}` : '-'}
          </div>
        </div>
      </div>

      {/* Chart + List */}
      {expenses.length > 0 && pieData.length > 0 && (
        <div className="expense-chart-card">
          <h4>Spending by Category</h4>
          <div className="expense-chart-content">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(val) => `${currency}${val.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="expense-chart-legend">
              {pieData.map(d => (
                <div key={d.name} className="expense-legend-item">
                  <span className="expense-legend-dot" style={{ background: d.color }}></span>
                  <span>{d.name}</span>
                  <span className="expense-legend-val">{currency}{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="expense-filter-row">
        <input className="form-input expense-search" placeholder="Filter Expenses..." value={filter} onChange={e => setFilter(e.target.value === filter ? '' : e.target.value)} style={{ maxWidth: 280 }} />
        <div className="expense-cat-filters">
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(f => f === c ? '' : c)}
              style={{ '--cat-color': CAT_COLORS[c] }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="section-empty"><div className="loading-spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="expense-empty">
          <div className="expense-empty-icon">💳</div>
          <h3>You haven't added any Expenses yet!</h3>
          <p>Effortlessly Track Your Expenses and Stay On Budget!</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>Add a New Expense</button>
        </div>
      ) : (
        <div className="expense-table-wrap">
          <table className="expense-table">
            <thead>
              <tr>
                <th>For</th>
                <th>Who Spent</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => {
                const CatIcon = CAT_ICONS[exp.category] || MoreHorizontal;
                return (
                  <tr key={exp._id}>
                    <td className="exp-for">{exp.forWhat}</td>
                    <td>{exp.whoSpentName || exp.addedBy?.name}</td>
                    <td>
                      <span className="exp-cat-badge" style={{ background: `${CAT_COLORS[exp.category]}18`, color: CAT_COLORS[exp.category] }}>
                        {typeof CatIcon === 'string' ? CatIcon : <CatIcon size={12} />} {exp.category}
                      </span>
                    </td>
                    <td className="exp-amount">{currency}{exp.amount?.toLocaleString()}</td>
                    <td className="exp-date">{new Date(exp.date).toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}</td>
                    <td>
                      {exp.addedBy?._id === user?.id && (
                        <button className="exp-delete-btn" onClick={() => handleDelete(exp._id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="expense-table-footer">{filtered.length} of {expenses.length} row(s)</div>
        </div>
      )}

      {/* Add Expense Drawer */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="expense-drawer" onClick={e => e.stopPropagation()}>
            <div className="expense-drawer-header">
              <div>
                <h3>Add Expense</h3>
                <p>Add your expenses during the travel to efficiently track it at the end.</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="expense-form">
              <div className="form-group">
                <label className="form-label">For</label>
                <input type="text" className="form-input" placeholder="What what purpose did you spend?"
                  value={form.forWhat} onChange={e => setForm(f => ({...f, forWhat: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Who Spent</label>
                <input type="text" className="form-input" placeholder="Person's name"
                  value={form.whoSpentName} onChange={e => setForm(f => ({...f, whoSpentName: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount ({currency})</label>
                <input type="number" className="form-input" placeholder="e.g. 1000"
                  value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">On</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full">Add Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
