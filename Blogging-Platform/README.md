# ✍️ InkFlow - Full Stack Blogging & Content Platform

A modern full-stack blogging platform featuring article writing (CRUD), pagination, tags filtering, content search, and user comments management.

## 🚀 Key Features

*   **Article CRUD**: Logged-in writers can create, read, update, and delete their blog posts.
*   **Search & Pagination**: Live query-based text search over articles, combined with page-controlled pagination.
*   **Tag Filtering**: Filter article feeds dynamically by click-selecting popular tags (e.g. #tech, #webdev, #lifestyle).
*   **Interactive Comments Section**: Read comments, submit new authenticated comments on articles, and moderate/delete them.
*   **Permissions Guard**: Strict validation checks prevent users from updating or deleting blog posts or comments that they did not author. Post owners are also granted permission to delete any comment left under their own articles.
*   **Zero-Setup Local Database Fallback**: Automatically falls back to a pre-populated local JSON file database (`backend/data/db.json`) if MongoDB is offline or disconnected, ensuring instant execution.
*   **Premium Visual Design**: Built using custom dark obsidian glassmorphism card templates, smooth focus animations, and typography pairings (Plus Jakarta Sans for UI, Lora for readability).

---

## 🛠️ Project Structure

```text
Blogging-Platform/
├── backend/
│   ├── config/          # DB connections & JSON DB helpers
│   ├── controllers/     # Route controllers (auth, posts CRUD, comments)
│   ├── middleware/      # Protected route auth check middleware
│   ├── models/          # Mongoose collections (User, Post, Comment)
│   ├── data/            # Local JSON database storage location (pre-populated)
│   ├── .env             # Backend variables
│   └── server.js        # Express application entry
└── frontend/
    ├── src/
    │   ├── App.jsx      # React router, feed dashboard, write post form, post detail view
    │   ├── index.css    # Premium CSS design system
    │   └── main.jsx     # App mount root
    ├── index.html
    └── vite.config.js   # Vite config (runs on Port 5174)
```

---

## ⚙️ Running Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed. If you have **MongoDB** running locally, it will connect automatically. If not, the application will use the pre-populated JSON database.

### 2. Start the Backend Server
Navigate to the `backend` folder and start the dev server:
```bash
cd backend
npm run dev
```
*The server will run on `http://localhost:5001`.*

### 3. Start the Frontend Application
Navigate to the `frontend` folder and start the dev server:
```bash
cd ../frontend
npm run dev
```
*The app will run on `http://localhost:5174`.*

---

## 🔒 API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Public | Register a new blogger profile |
| **POST** | `/api/auth/login` | Public | Sign in to start writing |
| **GET** | `/api/auth/me` | Private | Verify authentication status |
| **GET** | `/api/posts` | Public | Fetch all blog posts (supports `page`, `limit`, `search`, and `tag` query params) |
| **GET** | `/api/posts/:id` | Public | Fetch detailed article content |
| **POST** | `/api/posts` | Private | Create a new blog post |
| **PUT** | `/api/posts/:id` | Private | Update an existing post (ownership validated) |
| **DELETE** | `/api/posts/:id` | Private | Delete a post (ownership validated) |
| **GET** | `/api/posts/:postId/comments` | Public | Get all comments under a post |
| **POST** | `/api/posts/:postId/comments` | Private | Submit a comment |
| **DELETE** | `/api/comments/:id` | Private | Delete a comment (comment author or post owner only) |
