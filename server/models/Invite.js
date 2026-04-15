const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  role: { type: String, enum: ['viewer', 'editor'], default: 'editor' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invite', inviteSchema);
