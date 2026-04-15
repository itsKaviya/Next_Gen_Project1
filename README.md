# ✈️ TripWise — AI-Powered Travel Planner

A full-stack MERN travel planning platform powered by **Google Gemini AI** and **Google Maps API**.

---

## 🚀 Features

- **AI Itinerary Generation** — Gemini AI creates detailed day-by-day travel plans
- **Budget Feasibility Check** — AI analyzes your budget before committing
- **Smart Destination Search** — AI-powered location suggestions
- **Expense Tracker** — Real-time expense tracking with category analytics
- **Email Collaboration** — Invite friends via email to co-plan trips
- **Analytics Dashboard** — Visual charts and trip statistics
- **Weather Analysis** — AI-powered weather insights for travel dates
- **Packing Checklist** — Smart AI-generated packing lists

---

## 📁 Project Structure

```
tripwise/
├── server/                 # Express.js backend
│   ├── models/             # MongoDB schemas
│   │   ├── User.js
│   │   ├── Trip.js
│   │   ├── Expense.js
│   │   └── Invite.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── trips.js
│   │   ├── expenses.js
│   │   ├── ai.js           # Gemini AI integration
│   │   └── invite.js       # Email invites
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── .env
│   ├── package.json
│   └── index.js
│
└── client/                 # React frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── pages/
        │   ├── LandingPage.js      # Hero landing page
        │   ├── LoginPage.js        # Auth pages
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js    # Analytics dashboard
        │   ├── PlanTripPage.js     # 4-step trip wizard
        │   ├── TripDetailPage.js   # Full trip view
        │   └── AcceptInvitePage.js # Invite acceptance
        ├── components/
        │   ├── shared/
        │   │   └── Sidebar.js
        │   └── trip/
        │       ├── ExpenseTracker.js
        │       └── InviteModal.js
        ├── context/
        │   └── AuthContext.js
        ├── styles/
        │   └── global.css
        └── App.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API Key
- Google Maps API Key
- Gmail account (for email invites)

---

### 1. Clone & Install

```bash
# Install server dependencies
cd tripwise/server
npm install

# Install client dependencies
cd ../client
npm install
```

---

### 2. Configure Environment Variables

Edit `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tripwise
JWT_SECRET=your_super_secret_key_here_change_this

# Your API Keys
GOOGLE_GEMINI_API_KEY="your_google_gemini_api_key_here"
GEMINI_MODEL="gemini model_here"
GEMINI_API_VERSION="gemini_api_version_here"
GOOGLE_MAP_API_KEY="your_google_map_api_key_here"

# Gmail for invite emails (use App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

CLIENT_URL=http://localhost:3000
```

#### Setting up Gmail App Password:
1. Go to your Google Account → Security
2. Enable 2-Factor Authentication
3. Search for "App passwords"
4. Generate a new app password for "Mail"
5. Use that 16-character password as `EMAIL_PASS`

---

### 3. Start MongoDB

```bash
# If running MongoDB locally
mongod

# Or use MongoDB Atlas - update MONGODB_URI in .env
```

---

### 4. Run the Application

**Terminal 1 — Backend:**
```bash
cd tripwise/server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd tripwise/client
npm start
# React app starts on http://localhost:3000
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips` | Create trip |
| GET | `/api/trips` | Get all user trips |
| GET | `/api/trips/:id` | Get single trip |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| GET | `/api/trips/analytics/summary` | Get analytics |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/feasibility` | Check trip feasibility |
| POST | `/api/ai/generate-plan` | Generate full itinerary |
| POST | `/api/ai/places-suggest` | Destination autocomplete |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Add expense |
| GET | `/api/expenses/trip/:tripId` | Get trip expenses |
| DELETE | `/api/expenses/:id` | Delete expense |

### Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invite/send` | Send email invite |
| GET | `/api/invite/:token` | Get invite details |
| POST | `/api/invite/accept/:token` | Accept invite |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS with CSS Variables |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| AI | Google Gemini 1.5 Flash |
| Maps | Google Maps API |
| Email | Nodemailer + Gmail |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 🔧 Common Issues

**MongoDB connection fails:**
```bash
# Make sure MongoDB is running
sudo systemctl start mongod
# Or check MongoDB Atlas connection string
```

**Gemini API errors:**
- Verify your API key is correct in `.env`
- Check quota limits at console.cloud.google.com
- The app uses `gemini-1.5-flash` model

**Email invites not sending:**
- Must use Gmail App Password (not regular password)
- Enable 2FA on your Gmail account first
- Check spam folder for test emails

**CORS errors:**
- Make sure `CLIENT_URL=http://localhost:3000` in server `.env`
- Restart server after changing `.env`

---

## 📸 App Screenshots Flow

1. **Landing Page** — Hero with animated destination rotator + floating cards
2. **Register/Login** — Split layout with travel quote
3. **Dashboard** — Analytics cards + charts + recent trips grid
4. **Plan Trip** — 4-step wizard: Destination → Preferences → Budget → AI Feasibility
5. **Trip Detail** — Sidebar nav with Highlights, Weather, Itinerary, Budget, Packing, Expenses
6. **Expense Tracker** — Add/filter/delete expenses with pie chart analytics
7. **Invite** — Email invite system with accept page

---

## 🚢 Deployment

### Backend (Railway/Render):
```bash
# Set environment variables on your hosting platform
# Deploy from GitHub
```

### Frontend (Vercel/Netlify):
```bash
cd client
npm run build
# Upload build/ folder or connect GitHub
# Set: REACT_APP_API_URL=https://your-backend.railway.app
```

Update `axios.defaults.baseURL` in `AuthContext.js` to your production backend URL.

---

Built with ❤️ by Ankit Singh using MERN Stack + Google Gemini AI
