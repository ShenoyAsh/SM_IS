# 🔐 SecureAuth - Full Stack Authentication System

A complete full-stack authentication system featuring user registration, login, profile management, JWT access token, and secure cookie-based Token Refresh mechanism.

## 🚀 Key Features

*   **Secure Authentication**: Password hashing using `bcryptjs` and user session verification with `jsonwebtoken` (JWT).
*   **Dual Token System**: Uses short-lived Access Tokens (15m) for API request authorization and long-lived Refresh Tokens (7d) for secure silent sessions.
*   **Automatic Token Refresh Interceptor**: The React frontend intercepts expired access token requests (catching HTTP `401` status), calls the refresh token endpoint in the background to fetch a new access token, and retries the original API request seamlessly.
*   **Zero-Setup Local Database Fallback**: If MongoDB is not running, the backend automatically falls back to storing data in a local JSON file database (`backend/data/db.json`), ensuring it works out-of-the-box.
*   **Live Security Logs Console**: A UI console panel on the dashboard that logs background security tasks (e.g. API requests, JWT expiry, automatic refresh triggers, logout sessions) in real-time.
*   **Premium Visual Design**: Dark-theme obsidian UI built with CSS variables, custom glassmorphism panels, and smooth micro-animations.

---

## 🛠️ Project Structure

```text
Authentication-System/
├── backend/
│   ├── config/          # DB connections & JSON DB helpers
│   ├── controllers/     # Auth controllers (signup, login, refresh, profile)
│   ├── middleware/      # Protected route auth check middleware
│   ├── models/          # User Mongoose schema
│   ├── data/            # Local JSON database storage location
│   ├── .env             # Backend variables
│   └── server.js        # Express application entry
└── frontend/
    ├── src/
    │   ├── App.jsx      # React router, auth state provider, pages
    │   ├── index.css    # Premium CSS design system
    │   └── main.jsx     # App mount root
    ├── index.html
    └── vite.config.js   # Vite config (runs on Port 5173)
```

---

## ⚙️ Running Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed. Mongoose is configured, so if you have **MongoDB** installed and running on your machine, it will connect automatically. If not, it will default to the JSON database.

### 2. Start the Backend Server
Navigate to the `backend` folder and start the dev server:
```bash
cd backend
npm run dev
```
*The server will run on `http://localhost:5000`.*

### 3. Start the Frontend Application
Navigate to the `frontend` folder and start the dev server:
```bash
cd ../frontend
npm run dev
```
*The app will run on `http://localhost:5173`.*

---

## 🔒 API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Public | Register a new user |
| **POST** | `/api/auth/login` | Public | Login & retrieve JWTs |
| **POST** | `/api/auth/refresh` | Public | Generate a new Access Token using Refresh Token |
| **GET** | `/api/auth/profile` | Private | Fetch user details |
| **PUT** | `/api/auth/profile` | Private | Update user name, bio, avatar, or password |
| **POST** | `/api/auth/logout` | Private | Invalidate refresh token & clear cookies |
