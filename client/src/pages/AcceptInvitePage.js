import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Check, AlertCircle, Loader, Plane } from 'lucide-react';
import './AcceptInvitePage.css';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => { fetchInvite(); }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await axios.get(`/api/invite/${token}`);
      setInvite(res.data);
    } catch {
      setError('This invite link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) return navigate(`/login?redirect=/invite/accept/${token}`);
    setAccepting(true); setError('');
    try {
      const res = await axios.post(`/api/invite/accept/${token}`);
      setAccepted(true);
      setTimeout(() => navigate(`/trip/${res.data.tripId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return (
    <div className="invite-page">
      <div className="invite-loading"><Loader size={36} className="spin-icon" /><p>Loading invite...</p></div>
    </div>
  );

  return (
    <div className="invite-page">
      <div className="invite-container">
        <Link to="/" className="invite-brand"><Plane size={24} /> TripWise</Link>

        {error ? (
          <div className="invite-card error-card">
            <AlertCircle size={40} color="var(--danger)" />
            <h2>Invalid Invite</h2>
            <p>{error}</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
          </div>
        ) : accepted ? (
          <div className="invite-card success-card">
            <div className="success-icon"><Check size={32} /></div>
            <h2>Invite Accepted! 🎉</h2>
            <p>You've joined the trip. Redirecting you to the trip plan...</p>
          </div>
        ) : (
          <div className="invite-card">
            <div className="invite-emoji">✈️</div>
            <h2>You're invited to a trip!</h2>
            <p className="invite-by"><strong>{invite?.invitedBy?.name}</strong> has invited you to collaborate on their trip</p>

            {invite?.trip && (
              <div className="invite-trip-info">
                <div className="invite-trip-dest">
                  <MapPin size={18} />
                  <span>{invite.trip.destination}</span>
                </div>
                {(invite.trip.startDate || invite.trip.endDate) && (
                  <div className="invite-trip-dates">
                    <Calendar size={15} />
                    {invite.trip.startDate} → {invite.trip.endDate}
                  </div>
                )}
              </div>
            )}

            <div className="invite-role-badge">
              Role: <strong>{invite?.role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}</strong>
            </div>

            {!user ? (
              <div className="invite-auth-prompt">
                <p>You need to be signed in to accept this invite.</p>
                <div className="invite-auth-actions">
                  <Link to={`/login?redirect=/invite/accept/${token}`} className="btn btn-primary">Sign In to Accept</Link>
                  <Link to={`/register?redirect=/invite/accept/${token}`} className="btn btn-outline">Create Account</Link>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary btn-full invite-accept-btn" onClick={handleAccept} disabled={accepting}>
                {accepting ? <><span className="btn-spinner"></span> Accepting...</> : '✅ Accept Invitation'}
              </button>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}><AlertCircle size={16} />{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
