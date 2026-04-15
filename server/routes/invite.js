const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invite = require('../models/Invite');
const Trip = require('../models/Trip');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Send invite
router.post('/send', auth, async (req, res) => {
  try {
    const { tripId, email, role } = req.body;
    
    const trip = await Trip.findById(tripId).populate('owner', 'name');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.owner._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only owner can invite' });

    // Check if already invited
    const existing = await Invite.findOne({ trip: tripId, email, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Invite already sent to this email' });

    const token = uuidv4();
    const invite = new Invite({ trip: tripId, invitedBy: req.user._id, email, token, role: role || 'editor' });
    await invite.save();

    // Send email
    try {
      const transporter = createTransporter();
      const inviteUrl = `${process.env.CLIENT_URL}/invite/accept/${token}`;
      
      await transporter.sendMail({
        from: `TripWise <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${req.user.name} invited you to join their trip to ${trip.destination}!`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✈️ TripWise</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Your AI Travel Companion</p>
            </div>
            <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h2 style="color: #1a1a2e; margin-top: 0;">You're invited! 🎉</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                <strong>${req.user.name}</strong> has invited you to collaborate on their trip to <strong>${trip.destination}</strong>.
              </p>
              <div style="background: #f0f4ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; color: #667eea; font-weight: 600; font-size: 18px;">📍 ${trip.destination}</p>
                <p style="margin: 8px 0 0; color: #4a5568;">${trip.startDate} → ${trip.endDate}</p>
              </div>
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 8px 0;">
                Accept Invitation →
              </a>
              <p style="color: #718096; font-size: 14px; margin-top: 24px;">This invite expires in 7 days.</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.status(201).json({ message: 'Invite sent successfully', invite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept invite
router.post('/accept/:token', auth, async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token, status: 'pending' });
    if (!invite) return res.status(404).json({ message: 'Invite not found or expired' });
    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({ message: 'Invite has expired' });
    }

    const trip = await Trip.findById(invite.trip);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Add collaborator
    const alreadyCollaborator = trip.collaborators.some(c => c.user.toString() === req.user._id.toString());
    if (!alreadyCollaborator && trip.owner.toString() !== req.user._id.toString()) {
      trip.collaborators.push({ user: req.user._id, role: invite.role });
      await trip.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invite accepted', tripId: trip._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invite details (for accept page)
router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('trip', 'title destination startDate endDate coverImage')
      .populate('invitedBy', 'name');
    
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    res.json(invite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
