# Adaptive Finance - Gig Worker Income Tracker

A full-stack web application for gig workers to track daily income, manage work data, and export earnings records for financial analysis.

## Overview

Adaptive Finance helps gig workers (delivery drivers, couriers, etc.) track their daily work activity across different platforms and generate data exports for personal financial planning. Built with React, Node.js, and MongoDB, the app features a mobile-first responsive design with JWT authentication.

## Features

 **User Authentication**

- Secure signup and login with JWT tokens
- Password hashing with bcrypt
- Protected routes and API endpoints

 **Daily Income Entry**

- Log daily work activity: date, platform, hours worked, orders completed, income
- 2-month rolling history (editable past dates)
- Automatic detection of duplicate entries with update confirmation dialog
- Real-time form validation and error handling

 **Data Management**

- View all logged entries organized by date
- Edit existing entries with duplicate detection
- CSV export functionality for financial analysis

 **Mobile-First Design**

- Fully responsive layout (mobile, tablet, desktop)
- Collapsible hamburger menu for mobile navigation
- Touch-friendly interface with proper tap targets
- Keyboard accessible (focus states, ARIA labels)

 **Professional UI**

- Custom CSS design system with variables
- Smooth animations and transitions
- Loading states during API calls
- Error and success message displays
- Modal dialogs for confirmations

## Technology Stack

### Frontend

- **React 19.2.4** - UI framework
- **Vite 8.0.0** - Build tool and dev server
- **React Router 6** - Client-side routing with protected routes
- **CSS3** - Custom styling with CSS variables (no external libraries)

### Backend

- **Node.js + Express** - Server and API
- **MongoDB + Mongoose** - Database and ODM
- **bcrypt** - Password hashing
- **jsonwebtoken (JWT)** - Authentication tokens
- **dotenv** - Environment configuration

## Project Structure

```
LYProject/
├── client/                    # React frontend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── landing/       # Landing page
│   │   │   ├── auth/          # Login, Signup pages
│   │   │   ├── data/          # Data entry, Download pages
│   │   │   └── dashboard/     # Dashboard with routing
│   │   ├── components/        # Reusable components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js backend
│   ├── models/
│   │   ├── User.js            # User schema with bcrypt
│   │   └── DailyIncomeEntry.js # Income entry schema
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   └── dataController.js  # Data entry & export logic
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── dataRoutes.js
│   ├── services/
│   │   └── csvService.js      # CSV generation utilities
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── seed.js                # Database seeding script
│   ├── server.js              # Express app entry
│   └── package.json
│
├── data/                      # Data directory
├── models/                    # ML models (future)
├── scripts/                   # Utility scripts
└── README.md

```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/profile` - Get logged-in user profile (protected)

### Data Management

- `POST /api/data/entry` - Create or update daily income entry (protected)
- `GET /api/data/user` - Get all entries for logged-in user (protected)
- `GET /api/data/export` - Download entries as CSV (protected)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB 4.0+ (local or cloud)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Ha3ar6ous/adaptivefinance-LYProject.git
cd LYProject
```

2. **Backend setup**

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
node server.js
```

Backend runs on `http://localhost:5000`

3. **Frontend setup**

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Database Seeding

Load sample data (40 days of realistic Zomato delivery entries):

```bash
cd server
node seed.js
```

**Test Credentials:**

- Email: `rahul@example.com`
- Password: `password123`

## Usage

1. **Sign up** with email and password
2. **Log in** to access dashboard
3. **Enter data** for each working day:
   - Select date (up to 2 months history)
   - Enter platform (e.g., Zomato, Uber)
   - Log hours worked, orders completed, income earned
4. **Update entries** - System detects duplicates and asks for confirmation
5. **Download CSV** - Export all entries for analysis or other tools

## Sample Data

The seed script populates 40 days of realistic Zomato delivery data:

- **Sundays**: 0 income (rest days)
- **Working days**: 6-14 hours, 8-25 orders, ₹40-80 per order
- **Sample earnings**: ₹31,953 over 32 working days

## Error Handling

- Form validation with user-friendly error messages
- Duplicate entry detection with explicit confirmation dialog
- Loading states during API calls
- Network error handling with clear feedback
- Protected routes redirect unauthorized users to login

## Future Enhancements

- [ ] Income forecasting with SARIMA
- [ ] Financial health scoring
- [ ] Automated savings recommendations
- [ ] Data visualization (charts, graphs)
- [ ] Dark mode support
- [ ] Multi-platform support (mobile app)
- [ ] Expense tracking
- [ ] Budget management

## Testing

Manual testing credentials in seeded database:

```
Email: rahul@example.com
Password: password123
```

Browser DevTools recommended for testing responsive design and mobile features.

## Development

```bash
# Start both servers in parallel
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
cd client && npm run dev
```

## License

MIT License - See LICENSE file for details

## Author

Ritesh (Ha3ar6ous)
