const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: String,
  name: String,
  description: String,
  location: String,
  type: String,
  cost: Number,
  duration: String,
  tips: String
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: Number,
  date: String,
  title: String,
  activities: {
    type: [activitySchema],
    default: [],
    validate: {
      validator: (v) => Array.isArray(v),
      message: 'Activities must be an array'
    }
  }
});

const tripSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor'], default: 'editor' },
    joinedAt: { type: Date, default: Date.now }
  }],
  title: { type: String, required: true },
  destination: { type: String, required: true },
  startCity: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  duration: { type: Number },
  themes: [String],
  preferences: {
    pace: String,
    weather: String,
    accommodation: String,
    food: [String],
    transportTo: String,
    transportBetween: String
  },
  budget: {
    currency: { type: String, default: 'INR' },
    estimated: Number,
    estimatedMax: Number,
    breakdown: {
      accommodation: { min: Number, max: Number },
      food: { min: Number, max: Number },
      transport: { min: Number, max: Number },
      activities: { min: Number, max: Number },
      insurance: { min: Number, max: Number },
      contingency: { min: Number, max: Number }
    }
  },
  itinerary: [daySchema],
  highlights: [String],
  packingList: [String],
  weatherInfo: {
    summary: String,
    avgTemp: String,
    conditions: String,
    tips: [String]
  },
  coverImage: { type: String, default: '' },
  status: { type: String, enum: ['planning', 'upcoming', 'ongoing', 'completed'], default: 'planning' },
  isPublic: { type: Boolean, default: false },
  passengers: { type: Number, default: 1 },
  additionalNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tripSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
