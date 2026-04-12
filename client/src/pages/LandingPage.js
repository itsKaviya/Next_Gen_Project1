import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const DESTINATIONS = ['Bali', 'Paris', 'Tokyo', 'Santorini', 'New York', 'Dubai', 'Maldives', 'Rome'];
const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Planning', desc: 'Gemini AI crafts personalized itineraries based on your preferences, budget, and travel style.' },
  { icon: '🗺️', title: 'Smart Itineraries', desc: 'Day-by-day plans with timings, costs, tips, and hidden gems curated just for you.' },
  { icon: '💰', title: 'Budget Intelligence', desc: 'Real-time feasibility checks and smart budget breakdowns before you commit.' },
  { icon: '👥', title: 'Collaborate & Share', desc: 'Invite friends via email to co-plan and track shared expenses together.' },
  { icon: '📊', title: 'Expense Tracker', desc: 'Log expenses during your trip, split costs, and stay within budget effortlessly.' },
  { icon: '🌤️', title: 'Weather Insights', desc: 'AI-powered weather analysis and packing recommendations for your travel dates.' },
];

const STATS = [
  { value: '50K+', label: 'Trips Planned' },
  { value: '120+', label: 'Countries' },
  { value: '4.9★', label: 'Avg Rating' },
  { value: '98%', label: 'Happy Travelers' },
];

export default function LandingPage() {
  const [destIndex, setDestIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setDestIndex(i => (i + 1) % DESTINATIONS.length), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav" style={{ background: scrollY > 50 ? 'rgba(10,10,26,0.95)' : 'transparent' }}>
        <div className="nav-brand">
          <span className="brand-icon">✈️</span>
          <span className="brand-name">TripWise</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#stats">About</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.8)' }}>Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fadeIn">
            <span className="badge-dot"></span>
            Powered by Google Gemini AI
          </div>
          <h1 className="hero-title animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Plan Your Dream Trip to
            <br />
            <span className="hero-destination-rotate">
              {DESTINATIONS[destIndex]}
            </span>
          </h1>
          <p className="hero-subtitle animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            TripWise uses AI to build personalized travel itineraries, check budget feasibility,
            and help you collaborate with friends — all in one beautiful platform.
          </p>
          <div className="hero-actions animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="btn btn-primary btn-lg hero-cta-primary">
              Start Planning Free ✈️
            </Link>
            <Link to="/login" className="btn hero-cta-secondary btn-lg">
              Sign In →
            </Link>
          </div>

          <div className="hero-social-proof animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="avatars">
              {['A', 'B', 'C', 'D', 'E'].map((l, i) => (
                <div key={l} className="avatar-mini" style={{ background: ['#5b4fcf','#ec4899','#f59e0b','#10b981','#3b82f6'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <span>Join <strong>50,000+</strong> travelers already using TripWise</span>
          </div>
        </div>

        {/* Floating cards */}
        <div className="hero-cards">
          <div className="floating-card card-itinerary">
            <div className="fc-header">📅 Day 1 — Tokyo</div>
            <div className="fc-item">🏯 Senso-ji Temple — 9:00 AM</div>
            <div className="fc-item">🍜 Tsukiji Market Lunch</div>
            <div className="fc-item">🌸 Shinjuku Gyoen — 3:00 PM</div>
            <div className="fc-badge">AI Generated</div>
          </div>
          <div className="floating-card card-budget">
            <div className="fc-header">💰 Budget Analysis</div>
            <div className="fc-budget-row"><span>Accommodation</span><span>₹12,600</span></div>
            <div className="fc-budget-row"><span>Food</span><span>₹6,200</span></div>
            <div className="fc-budget-row"><span>Transport</span><span>₹8,400</span></div>
            <div className="fc-progress"><div className="fc-progress-bar" style={{ width: '68%' }}></div></div>
            <div className="fc-total">Total: ₹57,420</div>
          </div>
          <div className="floating-card card-collab">
            <div className="fc-header">👥 Trip Collaborators</div>
            <div className="fc-collab"><span className="collab-dot"></span> Ankit Singh — editing</div>
            <div className="fc-collab"><span className="collab-dot"></span> Priya Sharma — viewing</div>
            <div className="fc-invite-btn">+ Invite Friend</div>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" id="stats">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-tag">Why TripWise</div>
          <h2 className="section-title">Everything you need to travel smarter</h2>
          <p className="section-sub">From AI itinerary generation to real-time expense tracking, TripWise has every aspect of your journey covered.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <div className="section-tag">Simple Process</div>
          <h2 className="section-title">Your trip planned in 4 steps</h2>
        </div>
        <div className="steps-grid">
          {[
            { n: '01', title: 'Enter Destination', desc: 'Tell us where you want to go, your dates, and travel preferences.' },
            { n: '02', title: 'AI Feasibility Check', desc: 'Gemini AI analyzes your budget and suggests realistic cost ranges.' },
            { n: '03', title: 'Get Your Itinerary', desc: 'Receive a detailed day-by-day plan with activities, costs, and tips.' },
            { n: '04', title: 'Collaborate & Track', desc: 'Invite friends, track expenses, and stay on budget during your trip.' },
          ].map((step) => (
            <div key={step.n} className="step-card">
              <div className="step-number">{step.n}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready for your next adventure?</h2>
          <p className="cta-sub">Join thousands of travelers planning smarter with AI. It's free to start.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Start Planning Now ✈️</Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span>✈️</span>
          <strong>TripWise</strong>
        </div>
        <p className="footer-copy">© 2026 TripWise.</p>
      </footer>
    </div>
  );
}
