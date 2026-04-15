const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/invite', require('./routes/invite'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://ankitsingh75107:singh7676@lms.maxnebe.mongodb.net/?appName=lms')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

  console.log("my db is :"  , process.env.MONGODB_URI);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TripWise Server running on port ${PORT}`);
});
