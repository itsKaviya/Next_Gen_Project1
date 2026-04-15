import React, { useState } from 'react';
import axios from 'axios';
import { Mail, UserPlus, Check, AlertCircle, X } from 'lucide-react';
import './InviteModal.css';

export default function InviteModal({ tripId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post('/api/invite/send', { tripId, email, role });
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal invite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="invite-modal-title">
            <UserPlus size={20} color="var(--primary)" />
            <span className="modal-title">Invite a Collaborator</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="invite-desc">
          Invite someone to join your trip plan. They'll receive an email with a link to collaborate on itinerary and expenses.
        </p>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <Check size={16} /> Invite sent successfully! They'll receive an email shortly.
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSend} className="invite-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input type="email" className="form-input with-icon" placeholder="friend@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="role-options">
              {[
                { val: 'editor', label: 'Editor', desc: 'Can view and edit itinerary & add expenses' },
                { val: 'viewer', label: 'Viewer', desc: 'Can only view the plan' }
              ].map(r => (
                <div key={r.val} className={`role-option ${role === r.val ? 'active' : ''}`} onClick={() => setRole(r.val)}>
                  <div className="role-radio">{role === r.val && <div className="role-radio-dot"></div>}</div>
                  <div>
                    <div className="role-label">{r.label}</div>
                    <div className="role-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="invite-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner"></span> : <><Mail size={15} /> Send Invite</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
