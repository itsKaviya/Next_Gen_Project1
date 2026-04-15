import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/shared/Sidebar';
import {
  MapPin, Calendar, ChevronRight, ChevronLeft, Search, X,
  Loader, Check, AlertCircle, TrendingUp, Lightbulb, Navigation
} from 'lucide-react';
import './PlanTripPage.css';

const THEMES = ['Historical Sites and Landmarks','Adventure','Local Culture','Beaches','Hills, Nature and Wildlife','Nightlife','For the Gram','Shopping & Relaxation'];
const PACES = ['Slow and Easy','Balanced','Fast'];
const WEATHERS = ['Warm and Sunny','Cool and Breezy','Cold and Snowy','Mild and Pleasant','Rainy and Cozy'];
const ACCOMMODATIONS = ['3 Star','4 Star','5 Star','Airbnb','Homestay','Hostel'];
const FOODS = ['Vegetarian','Vegan','Gluten Free','Halal','Kosher','Local Cuisine'];
const TRANSPORTS = ['Flights','Trains','Buses','Road'];
const CURRENCIES = ['INR - Indian Rupee','USD - US Dollar','EUR - Euro','GBP - British Pound','AED - UAE Dirham'];

const STEPS = [
  { id: 1, title: 'Set the Course', subtitle: 'Define your destination and dates', icon: '🗺️' },
  { id: 2, title: 'Craft Your Comfort Zone', subtitle: 'Customize your travel style', icon: '⚙️' },
  { id: 3, title: 'Trip Budget & Companions', subtitle: 'Set budget and passengers', icon: '💰' },
  { id: 4, title: 'Feasibility Check', subtitle: 'AI analyzes your plan', icon: '🤖' },
];

export default function PlanTripPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    startCity: '', destination: '', startDate: '', endDate: '',
    themes: [], pace: '', weather: '', accommodation: '', food: [],
    transportTo: '', transportBetween: '',
    currency: 'INR - Indian Rupee', budget: '', passengers: 1, additionalNotes: ''
  });
  const [destSearch, setDestSearch] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feasibility, setFeasibility] = useState(null);
  const [feasibilityLoading, setFeasibilityLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggle = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]
  }));

  // Destination search
  const handleDestSearch = (val) => {
    setDestSearch(val);
    clearTimeout(searchTimeout.current);
    if (val.length < 2) { setDestSuggestions([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.post('/api/ai/places-suggest', { query: val });
        setDestSuggestions(res.data || []);
      } catch { setDestSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 500);
  };

  const selectDest = (place) => {
    set('destination', place.name);
    setDestSearch('');
    setDestSuggestions([]);
  };

  const useTypedDestination = () => {
    const value = destSearch.trim();
    if (!value) return;
    set('destination', value);
    setDestSearch('');
    setDestSuggestions([]);
  };

  const removeDest = () => set('destination', '');

  const canProceed = () => {
    if (step === 1) return form.startCity && (form.destination || destSearch.trim()) && form.startDate && form.endDate;
    if (step === 3) return form.passengers >= 1;
    return true;
  };

  const handleNext = async () => {
    setError('');
    if (step === 1 && !form.destination && destSearch.trim()) {
      useTypedDestination();
    }
    if (step === 3) {
      // Feasibility check
      setStep(4);
      setFeasibilityLoading(true);
      try {
        const currency = form.currency.split(' - ')[0];
        const res = await axios.post('/api/ai/feasibility', {
          startCity: form.startCity,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          themes: form.themes,
          preferences: { pace: form.pace, weather: form.weather, accommodation: form.accommodation, food: form.food, transportTo: form.transportTo },
          budget: { amount: Number(form.budget), currency },
          passengers: form.passengers
        });
        setFeasibility(res.data);
      } catch (err) {
        setError('Feasibility check failed. You can still generate your plan.');
      } finally {
        setFeasibilityLoading(false);
      }
    } else {
      setStep(s => Math.min(4, s + 1));
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError('');
    try {
      const currency = form.currency.split(' - ')[0];
      // Generate AI plan
      const planRes = await axios.post('/api/ai/generate-plan', {
        startCity: form.startCity, destination: form.destination,
        startDate: form.startDate, endDate: form.endDate,
        themes: form.themes, preferences: {
          pace: form.pace, weather: form.weather, accommodation: form.accommodation,
          food: form.food, transportTo: form.transportTo, transportBetween: form.transportBetween
        },
        budget: Number(form.budget), currency, passengers: form.passengers, additionalNotes: form.additionalNotes
      });

      const plan = planRes.data;
      const startDateObj = new Date(form.startDate);
      const endDateObj = new Date(form.endDate);
      const duration = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;

      // Ensure itinerary activities have numeric cost
      const processedItinerary = (plan.itinerary || []).map(day => ({
        ...day,
        activities: (day.activities || []).map(activity => ({
          ...activity,
          cost: Number(activity.cost) || 0
        }))
      }));

      // Save trip
      const tripData = {
        title: plan.title || `${form.destination} Trip`,
        destination: form.destination,
        startCity: form.startCity,
        startDate: form.startDate,
        endDate: form.endDate,
        duration,
        themes: form.themes,
        preferences: {
          pace: form.pace, weather: form.weather, accommodation: form.accommodation,
          food: form.food, transportTo: form.transportTo, transportBetween: form.transportBetween
        },
        budget: {
          currency,
          estimated: feasibility?.suggestedBudgetMin || 0,
          estimatedMax: feasibility?.suggestedBudgetMax || 0,
          breakdown: feasibility ? {
            accommodation: { min: 0, max: 0 },
            food: { min: 0, max: 0 },
            transport: { min: 0, max: 0 },
            activities: { min: 0, max: 0 },
            insurance: { min: 0, max: 0 },
            contingency: { min: 0, max: 0 }
          } : {}
        },
        itinerary: processedItinerary,
        highlights: plan.highlights || [],
        packingList: plan.packingList || [],
        weatherInfo: plan.weatherInfo || {},
        passengers: form.passengers,
        additionalNotes: form.additionalNotes,
        status: 'planning'
      };

      const tripRes = await axios.post('/api/trips', tripData);
      navigate(`/trip/${tripRes.data._id}`);
    } catch (err) {
      setError('Plan generation failed. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="plan-page">
          <div className="plan-wizard">
            {/* Left Panel */}
            <div className="plan-left">
              <div className="plan-steps-indicator">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className={`step-dot ${step > s.id ? 'done' : step === s.id ? 'active' : ''}`}>
                      {step > s.id ? <Check size={14} /> : s.id}
                    </div>
                    {i < STEPS.length - 1 && <div className={`step-line ${step > s.id ? 'done' : ''}`}></div>}
                  </React.Fragment>
                ))}
              </div>
              <div className="plan-left-icon">{STEPS[step - 1]?.icon}</div>
              <h2 className="plan-left-title">{STEPS[step - 1]?.title}</h2>
              <p className="plan-left-subtitle">{STEPS[step - 1]?.subtitle}</p>
            </div>

            {/* Right Panel */}
            <div className="plan-right">
              {step === 1 && (
                <div className="step-content animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Where are you starting your trip from?</label>
                    <div className="input-icon-wrap">
                      <Navigation size={16} className="input-icon" />
                      <input type="text" className="form-input with-icon" placeholder="Enter your start city here..."
                        value={form.startCity} onChange={e => set('startCity', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Search for your destination country/city</label>
                    {form.destination ? (
                      <div className="selected-dest">
                        <MapPin size={14} />
                        <span>{form.destination}</span>
                        <button onClick={removeDest}><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="dest-search-wrap">
                        <div className="input-icon-wrap">
                          <Search size={16} className="input-icon" />
                          <input type="text" className="form-input with-icon" placeholder="Search for places..."
                            value={destSearch}
                            onChange={e => handleDestSearch(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                useTypedDestination();
                              }
                            }} />
                          {searchLoading && <Loader size={16} className="input-spin" style={{ position:'absolute', right:12 }} />}
                        </div>
                        {!!destSearch.trim() && destSuggestions.length === 0 && (
                          <div className="dest-suggestions">
                            <div className="dest-suggestion-item" onClick={useTypedDestination}>
                              <MapPin size={14} />
                              <div>
                                <div className="dest-sug-name">Use "{destSearch.trim()}"</div>
                                <div className="dest-sug-desc">Continue without AI suggestions</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {destSuggestions.length > 0 && (
                          <div className="dest-suggestions">
                            {destSuggestions.map((s, i) => (
                              <div key={i} className="dest-suggestion-item" onClick={() => selectDest(s)}>
                                <MapPin size={14} />
                                <div>
                                  <div className="dest-sug-name">{s.name}</div>
                                  {s.description && <div className="dest-sug-desc">{s.description}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Dates</label>
                    <div className="date-range-inputs">
                      <div className="input-icon-wrap" style={{ flex: 1 }}>
                        <Calendar size={16} className="input-icon" />
                        <input type="date" className="form-input with-icon"
                          value={form.startDate} onChange={e => set('startDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <span className="date-range-sep">→</span>
                      <div className="input-icon-wrap" style={{ flex: 1 }}>
                        <Calendar size={16} className="input-icon" />
                        <input type="date" className="form-input with-icon"
                          value={form.endDate} onChange={e => set('endDate', e.target.value)}
                          min={form.startDate || new Date().toISOString().split('T')[0]} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Which travel themes best describe your dream getaway? <span className="optional">(Optional)</span></label>
                    <div className="chip-group">
                      {THEMES.map(t => (
                        <div key={t} className={`chip ${form.themes.includes(t) ? 'active' : ''}`} onClick={() => toggle('themes', t)}>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content animate-fadeIn">
                  <PreferenceSection label="What pace of travel do you prefer?" optional options={PACES} selected={form.pace} onSelect={v => set('pace', form.pace === v ? '' : v)} single />
                  <PreferenceSection label="What kind of weather do you prefer?" optional options={WEATHERS} selected={form.weather} onSelect={v => set('weather', form.weather === v ? '' : v)} single />
                  <PreferenceSection label="What type of accommodation would you prefer?" optional options={ACCOMMODATIONS} selected={form.accommodation} onSelect={v => set('accommodation', form.accommodation === v ? '' : v)} single />
                  <PreferenceSection label="What type of food would you like?" optional options={FOODS} selected={form.food} onSelect={v => toggle('food', v)} />
                  <PreferenceSection label="How would you like to travel from departure to destination?" optional options={TRANSPORTS} selected={form.transportTo} onSelect={v => set('transportTo', form.transportTo === v ? '' : v)} single />
                  <PreferenceSection label="How would you prefer to travel between destinations?" optional options={[...TRANSPORTS, 'Ferry']} selected={form.transportBetween} onSelect={v => set('transportBetween', form.transportBetween === v ? '' : v)} single />
                </div>
              )}

              {step === 3 && (
                <div className="step-content animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Which currency? <span className="optional">(Optional)</span></label>
                    <select className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated travel budget <span className="optional">(Optional)</span></label>
                    <div className="budget-input-wrap">
                      <span className="budget-currency-tag">{form.currency.split(' - ')[0]}</span>
                      <input type="number" className="form-input" style={{ paddingLeft: 60 }} placeholder="e.g. 50000"
                        value={form.budget} onChange={e => set('budget', e.target.value)} min="0" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">How many passengers? <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span></label>
                    <select className="form-input" value={form.passengers} onChange={e => set('passengers', Number(e.target.value))}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional preferences or specific places/activities <span className="optional">(Optional)</span></label>
                    <textarea className="form-input" rows={4} placeholder="e.g., I want to visit the Taj Mahal, try street food in Old Delhi..."
                      value={form.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="step-content animate-fadeIn">
                  {feasibilityLoading ? (
                    <div className="feasibility-loading">
                      <div className="feasibility-spinner"></div>
                      <h3>Analyzing Feasibility...</h3>
                      <p>We're evaluating your trip details to make sure everything fits your preferences and budget.</p>
                      <div className="feasibility-time-badge">
                        <AlertCircle size={14} /> A quick 10-20 seconds is all it takes to assess feasibility
                      </div>
                    </div>
                  ) : feasibility ? (
                    <div className="feasibility-results">
                      <h3 className="feasibility-heading">
                        <TrendingUp size={20} /> AI Suggestions
                      </h3>

                      {/* Budget Card */}
                      <div className="feasibility-card">
                        <div className="feasibility-card-title">📈 Budget Suggestion</div>
                        <div className="feasibility-budget-row">
                          <div>
                            <div className="feas-label">Suggested Budget</div>
                            <div className="feas-budget-range">
                              {form.currency.split(' - ')[0] === 'INR' ? '₹' : '$'}{feasibility.suggestedBudgetMin?.toLocaleString()} — {form.currency.split(' - ')[0] === 'INR' ? '₹' : '$'}{feasibility.suggestedBudgetMax?.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="feas-label">Your Budget</div>
                            <div className="feas-your-budget">{form.currency.split(' - ')[0] === 'INR' ? '₹' : '$'}{Number(form.budget || 0).toLocaleString() || '0'}</div>
                          </div>
                        </div>
                        <p className="feas-explanation">{feasibility.budgetExplanation}</p>
                      </div>

                      {/* Missing Experiences */}
                      {feasibility.missingExperiences?.length > 0 && (
                        <div className="feasibility-card">
                          <div className="feasibility-card-title"><Lightbulb size={16} /> Experiences you are missing</div>
                          <ul className="feas-list">
                            {feasibility.missingExperiences.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Alternative Destinations */}
                      {feasibility.alternativeDestinations?.length > 0 && (
                        <div className="feasibility-card">
                          <div className="feasibility-card-title"><MapPin size={16} /> Alternative Destinations</div>
                          <ul className="feas-list">
                            {feasibility.alternativeDestinations.map((d, i) => (
                              <li key={i}><strong>{d.name}</strong> — {d.reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
                    </div>
                  ) : (
                    <div className="feasibility-loading">
                      {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
                      <p>Ready to generate your plan!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="plan-nav-footer">
                {step > 1 && step < 4 && (
                  <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                {step === 4 && !feasibilityLoading && (
                  <button className="btn btn-ghost" onClick={() => setStep(3)}>
                    <ChevronLeft size={16} /> Go Back
                  </button>
                )}
                <div style={{ marginLeft: 'auto' }}>
                  {step < 3 && (
                    <button className="btn btn-primary" onClick={handleNext} disabled={!canProceed()}>
                      Continue <ChevronRight size={16} />
                    </button>
                  )}
                  {step === 3 && (
                    <button className="btn btn-primary" onClick={handleNext} disabled={!canProceed()}>
                      Check Feasibility <ChevronRight size={16} />
                    </button>
                  )}
                  {step === 4 && !feasibilityLoading && (
                    <button className="btn btn-primary" onClick={handleGeneratePlan} disabled={generating}>
                      {generating ? <><span className="btn-spinner"></span> Generating...</> : <>✨ Generate Plan with AI</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PreferenceSection({ label, optional, options, selected, onSelect, single }) {
  return (
    <div className="form-group">
      <label className="form-label">{label} {optional && <span className="optional">(Optional)</span>}</label>
      <div className="chip-group">
        {options.map(opt => (
          <div key={opt} className={`chip ${(single ? selected === opt : selected?.includes(opt)) ? 'active' : ''}`} onClick={() => onSelect(opt)}>
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}
