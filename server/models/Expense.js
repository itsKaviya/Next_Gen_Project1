const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  forWhat: { type: String, required: true },
  whoSpent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  whoSpentName: { type: String },
  category: { 
    type: String, 
    enum: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'health', 'other'],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  date: { type: Date, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
