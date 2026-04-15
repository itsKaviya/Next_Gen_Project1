const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');

// Add expense
router.post('/', auth, async (req, res) => {
  try {
    const { tripId, forWhat, whoSpentName, category, amount, currency, date, notes } = req.body;
    
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isCollaborator = trip.collaborators.some(c => c.user.toString() === req.user._id.toString());
    if (!isOwner && !isCollaborator) return res.status(403).json({ message: 'Access denied' });

    const expense = new Expense({
      trip: tripId,
      addedBy: req.user._id,
      forWhat,
      whoSpentName: whoSpentName || req.user.name,
      category,
      amount,
      currency: currency || 'INR',
      date: new Date(date),
      notes
    });
    
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expenses for a trip
router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isCollaborator = trip.collaborators.some(c => c.user.toString() === req.user._id.toString());
    if (!isOwner && !isCollaborator) return res.status(403).json({ message: 'Access denied' });

    const expenses = await Expense.find({ trip: req.params.tripId })
      .populate('addedBy', 'name email')
      .sort({ date: -1 });
    
    // Analytics
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const byPerson = expenses.reduce((acc, e) => {
      const name = e.whoSpentName || 'Unknown';
      acc[name] = (acc[name] || 0) + e.amount;
      return acc;
    }, {});
    
    res.json({ expenses, analytics: { totalAmount, byCategory, byPerson } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.addedBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
    
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
