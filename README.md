# 🌟 Multi-Project Full-Stack Workspace

This workspace houses two decoupled, production-ready full-stack applications built with modern engineering practices, premium obsidian styling systems, and zero-setup database connectivity.

---

## 📂 Repository Contents

The repository is structured into two standalone project ecosystems:

### 1. [🔐 Authentication System](./Authentication-System)
*   **Location**: `Authentication-System/`
*   **Core Focus**: JWT-based session security, secure cookie-based token handling, and a Silent Token Refresh background execution flow.
*   **Key Feature**: Includes a live "Security logs panel" rendered in the dashboard dashboard to monitor silent refresh cycles and security events in real-time.
*   **Ports**: Backend: `5000` | Frontend: `5173`

### 2. [✍️ Blogging Platform](./Blogging-Platform)
*   **Location**: `Blogging-Platform/`
*   **Core Focus**: Content composition, paginated feed rendering, reactive query search, tag filters, and a multi-level role moderation commenting system.
*   **Key Feature**: Authenticated writer restrictions (preventing unauthorized post modification) combined with comment administration tools (post authors can delete any comment on their post).
*   **Ports**: Backend: `5001` | Frontend: `5174`

---

## 🛠️ Architecture & Shared Features

Both projects share a cohesive backend/frontend design pattern:
1.  **Dual Database Support (Zero-Setup)**:
    Both backends attempt to connect to a local **MongoDB** server. If MongoDB is unavailable, they automatically fall back to a local JSON file-based database (`backend/data/db.json`). All operations (signup, login, post creation, comments, profile updates) will run out-of-the-box.
2.  **Premium Glassmorphic Design**:
    Styled with a dark obsidian palette, translucent panels, linear boundary gradients, responsive flex/grid layouts, custom infinite keyframe spinners, and responsive typography (`Plus Jakarta Sans` and `Lora`).

---

## 🚀 Getting Started

### Project 1: Start the Authentication System

```bash
# Terminal 1: Run the Express Backend
cd Authentication-System/backend
npm run dev

# Terminal 2: Run the Vite Frontend
cd Authentication-System/frontend
npm run dev
```

### Project 2: Start the Blogging Platform

```bash
# Terminal 1: Run the Express Backend
cd Blogging-Platform/backend
npm run dev

# Terminal 2: Run the Vite Frontend
cd Blogging-Platform/frontend
npm run dev
```

---

## 📄 Documentation Details
For detailed endpoint schemas, database schemas, and specific configurations of each application, refer to their individual documentations:
*   [Authentication System Guide](./Authentication-System/README.md)
*   [Blogging Platform Guide](./Blogging-Platform/README.md)
