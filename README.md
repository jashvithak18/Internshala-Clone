# MERN Internship Platform (Internshala Clone)

A highly scalable, production-ready, and responsive full-stack MERN (MongoDB, Express, React, Node.js) internship platform styled with a premium modern glassmorphic theme.

Equipped with a real-time community social feed, secure session auditing, a premium resume generator with PDF exports, multi-language localization (i18n), and robust automated security guardrails.

---

## Technical Stack Architecture

- **Frontend**: React.js, Vite, Tailwind CSS, React Router, Context API, i18next, Socket.io-client, Framer Motion, Canvas Confetti.
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, Socket.IO, JWT Security, Bcrypt hashing, Nodemailer.
- **Auditing**: express-useragent header processing.

---

## Quick Local Startup

Follow these simple steps to launch both services concurrently:

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (`mongodb://127.0.0.1:27017/internshala_clone`) OR a MongoDB Atlas cluster URI.

### Step 1: Clone & Configure Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure parameters inside the `.env` file (already initialized for you with test fallbacks):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/internshala_clone
   JWT_SECRET=super_secret_key_elevance_skills_internshala_2026_dbf06467
   ```
3. Start the Express server:
   ```bash
   npm run dev
   ```

### Step 2: Configure & Launch Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install modules and start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the local client address (typically `http://localhost:5173`).

---

## 🛠️ Sandbox Simulator & Rules Testing Guide

To provide an exceptional developer testing experience without needing real mobile devices, multiple browsers, or live mail configurations, the platform includes a **Sandbox Rule Simulator Panel** floating on the bottom right of your screen. 

Here is how to test every single requirement instantly:

### 1. Dynamic Posting Limits (Public Space)
- **Requirement**: Posting limits dynamically adjust based on friends. (0 friends ➜ cannot post, 1 friend ➜ 1 post/day, 2 friends ➜ 2 posts/day, 3-10 friends ➜ friend count, &gt;10 ➜ unlimited). Resets every 24 hours.
- **Testing**:
  1. Register a new user account. On register, you have **0 friends**.
  2. Attempt to publish a post in the Community Space. The platform blocks the request showing: *"Posting is blocked because you have 0 friends. Connecting with a friend allows you to post!"*
  3. Expand the **Connect & Add Friends** panel, search for another registered profile, and send a friend request.
  4. Switch accounts or check incoming logs to accept the request.
  5. As your friend count increments to **1**, notice the Posting Allowance card updates to *"Allowed: 1 post / day"*. Try posting; it allows exactly 1 post and blocks subsequent ones, displaying rules to unlock the next level.

### 2. Google Chrome Login OTP Rule
- **Requirement**: If a user logs in using Google Chrome, halt login, dispatch an OTP to their email, and authorize only after verification.
- **Testing**:
  1. In the floating Simulator panel, select **Google Chrome** under *Browser Agent*.
  2. Log out and try logging back in.
  3. Notice the portal intercepts the login, keeps the session gated, and prompts for a **6-digit OTP code**.
  4. **SMTP Ethereal Sandbox Mode**: Since a live mail setup isn't configured, the login screen displays a **"View Mock Email Inbox"** link. Click it to open your test mailbox, grab the secure code, enter it, and complete the login!
  5. Switch the simulated browser to **Firefox** or **Safari** and log in again; notice the system lets you enter instantly with no OTP codes.

### 3. Mobile Device Time Restrictions (10 AM - 1 PM IST)
- **Requirement**: If logging in from a mobile browser, allow access ONLY between 10:00 AM and 1:00 PM IST. Block access entirely outside this slot.
- **Testing**:
  1. In the Simulator panel, switch the *Device Type* to **iPhone (Mobile)**.
  2. If the simulated time falls outside **10:00 AM - 1:00 PM IST** (e.g. standard night hours), the viewport immediately dims, locks out the client, and shows an *"Emergency Mobile Access Intercepted"* gate.
  3. Switch the device back to **Workstation (Desktop)** or **MacBook (Laptop)**, and notice full access is instantly restored!

### 4. Subscription Payment Hour Limit (10 AM - 11 AM IST)
- **Requirement**: Payments (subscriptions & premium resume builder passes) are permitted ONLY between **10:00 AM and 11:00 AM IST**.
- **Testing**:
  1. Navigate to the **Premium Subscriptions** (Billing) tab.
  2. If the simulated clock hour is outside 10:00 AM - 11:00 AM IST, buy buttons are disabled and a warning card displays: *"Payments Gate is Closed... strictly allowed only between 10:00 AM and 11:00 AM IST"*.
  3. In the database or using server timers, check that the transaction endpoint intercepts and blocks billing if hit outside this slot.

### 5. French Language Security OTP Change
- **Requirement**: Changing preferred language setting to French requires secondary email OTP verification before applying.
- **Testing**:
  1. In the top header bar, click the Language dropdown and select **Français (French)**.
  2. A verification window slides open asking for a 6-digit OTP, and dispatches the code to your email.
  3. Click the mock email sandbox link in the modal, copy the code, input it, and verify.
  4. The platform dynamically applies French translations (`react-i18next` translation bundle updates the sidebar and dashboard texts) and saves the preference to MongoDB.
  5. Select Spanish or Hindi; notice they translate immediately with no verification.

### 6. Forgot Password System Cooldowns
- **Requirement**: Users can request a password reset only once per day using email or phone number. Password generator must use uppercase/lowercase alphabetical characters only (no numbers/symbols).
- **Testing**:
  1. On the login screen, click **Forgot Password?**.
  2. Enter your registered email or phone number.
  3. Submit. A secure purely alphabetical password (e.g. `JtKsDqWxAp`) is created, hashed with bcrypt, and sent to Ethereal mock inbox.
  4. Attempt to submit the reset request again immediately.
  5. The platform blocks the request and returns: *"You can use this option only once per day."*

---

## 🚀 Production Deployment Manuals

### 1. Database (MongoDB Atlas)
1. Register a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Establish a new cluster and create a database user with read/write access.
3. Configure connection security to allow access from anywhere (`0.0.0.0/0`).
4. Copy the connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/internshala_clone`.

### 2. Backend (Render / Heroku)
1. Sign in to [Render](https://render.com/).
2. Click **New > Web Service** and link your repository.
3. Configure fields:
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
4. Set Environment Variables in Render:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = *Your MongoDB Atlas URI string*
   - `JWT_SECRET` = *Secure random key*
   - *SMTP credentials if using real emails (SMTP_HOST, SMTP_USER, SMTP_PASS).*

### 3. Frontend (Vercel)
1. Register on [Vercel](https://vercel.com/).
2. Import your repository.
3. Configure the directory settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy! All routes and translation resources will build.
