const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Trip = require('../models/Trip');

const coerceNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const parseActivitiesString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  try {
    let jsonLike = trimmed;
    if (jsonLike.includes('+')) {
      const lines = jsonLike.split('\n').map((raw) => {
        let line = raw.trim();
        line = line.replace(/\+\s*$/, '');
        if (
          (line.startsWith('"') && line.endsWith('"')) ||
          (line.startsWith("'") && line.endsWith("'")) ||
          (line.startsWith('`') && line.endsWith('`'))
        ) {
          line = line.slice(1, -1);
        }
        return line;
      });
      jsonLike = lines.join('\n');
    }
    // Quote object keys: { key: -> { "key":
    jsonLike = jsonLike.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
    // Convert single-quoted strings to double-quoted
    jsonLike = jsonLike.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    // Remove trailing commas
    jsonLike = jsonLike.replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(jsonLike);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const sanitizeItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map((day, idx) => {
    const activitiesRaw = Array.isArray(day?.activities)
      ? day.activities
      : parseActivitiesString(day?.activities);

    const activities = Array.isArray(activitiesRaw) ? activitiesRaw : [];

    return {
      day: coerceNumber(day?.day) ?? idx + 1,
      date: typeof day?.date === 'string' ? day.date : undefined,
      title: typeof day?.title === 'string' ? day.title : undefined,
      activities: activities.map((a) => ({
        time: typeof a?.time === 'string' ? a.time : undefined,
        name: typeof a?.name === 'string' ? a.name : undefined,
        description: typeof a?.description === 'string' ? a.description : undefined,
        location: typeof a?.location === 'string' ? a.location : undefined,
        type: typeof a?.type === 'string' ? a.type : undefined,
        cost: coerceNumber(a?.cost),
        duration: typeof a?.duration === 'string' ? a.duration : undefined,
        tips: typeof a?.tips === 'string' ? a.tips : undefined
      }))
    };
  });
};

const sanitizeTripInput = (body = {}) => {
  const payload = { ...body };
  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    payload.title = typeof body.title === 'string' ? body.title.trim() : body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'destination')) {
    payload.destination = typeof body.destination === 'string' ? body.destination.trim() : body.destination;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'itinerary')) {
    payload.itinerary = sanitizeItinerary(body.itinerary);
  }
  return payload;
};

// Create trip
router.post('/', auth, async (req, res) => {
  try {
    const payload = sanitizeTripInput(req.body);
    if (!payload.title || !payload.destination) {
      return res.status(400).json({ message: 'Title and destination are required' });
    }
    const trip = new Trip({ ...payload, owner: req.user._id });
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    console.error('Trip creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all trips for user
router.get('/', auth, async (req, res) => {
  try {
    const owned = await Trip.find({ owner: req.user._id }).sort({ createdAt: -1 });
    const collaborated = await Trip.find({ 'collaborators.user': req.user._id }).populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({ owned, collaborated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single trip
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');
    
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner._id.toString() === req.user._id.toString();
    const isCollaborator = trip.collaborators.some(c => c.user._id.toString() === req.user._id.toString());
    
    if (!isOwner && !isCollaborator) return res.status(403).json({ message: 'Access denied' });
    
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update trip
router.put('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isEditor = trip.collaborators.some(c => c.user.toString() === req.user._id.toString() && c.role === 'editor');
    
    if (!isOwner && !isEditor) return res.status(403).json({ message: 'Access denied' });
    
    const payload = sanitizeTripInput(req.body);
    const updated = await Trip.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete trip
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
    
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add item to packing list
router.post('/:id/packing', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isEditor = trip.collaborators.some(c => c.user.toString() === req.user._id.toString() && c.role === 'editor');
    
    if (!isOwner && !isEditor) return res.status(403).json({ message: 'Access denied' });
    
    const { item } = req.body;
    if (!item || typeof item !== 'string' || !item.trim()) {
      return res.status(400).json({ message: 'Item is required' });
    }
    
    if (!trip.packingList) trip.packingList = [];
    trip.packingList.push(item.trim());
    await trip.save();
    
    res.json({ message: 'Item added', packingList: trip.packingList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove item from packing list
router.delete('/:id/packing/:index', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isEditor = trip.collaborators.some(c => c.user.toString() === req.user._id.toString() && c.role === 'editor');
    
    if (!isOwner && !isEditor) return res.status(403).json({ message: 'Access denied' });
    
    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= trip.packingList.length) {
      return res.status(400).json({ message: 'Invalid item index' });
    }
    
    trip.packingList.splice(index, 1);
    await trip.save();
    
    res.json({ message: 'Item removed', packingList: trip.packingList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get analytics
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ 
      $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }]
    });
    
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const upcomingTrips = trips.filter(t => t.status === 'upcoming' || t.status === 'planning').length;
    const destinations = [...new Set(trips.map(t => t.destination))];
    const totalBudget = trips.reduce((sum, t) => sum + (t.budget?.estimatedMax || 0), 0);
    
    res.json({ totalTrips, completedTrips, upcomingTrips, destinations: destinations.length, totalBudget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
