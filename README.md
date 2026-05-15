<div align="center">
  <img src="./client/public/poll-vault.png" alt="PollVault App Preview" width="100%" />
  <h1>Poll-Vault 🏛️</h1>
  <p><strong>A production-ready, real-time polling and survey platform built for modern teams.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green.svg)](https://www.mongodb.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io/)
</div>

<br />

PollVault empowers creators to build engaging, multi-type questionnaires, securely collect responses, and monitor live-updating analytics through a premium, interactive dashboard.

---

## ✨ Key Features

### 🛠️ Versatile Poll Creation
- **Multi-Type Questions**: Mix and match single-choice, multiple-choice, and open-ended text questions within a single poll.
- **Granular Controls**: Toggle required fields, set explicit expiration dates, and define response visibility.
- **Response Modes**: Choose between `Anonymous` (requires login, identity hidden) and `Named` (requires login, creator sees who voted) to protect data integrity and prevent duplicate voting.

### ⚡ Real-Time Live Analytics
- **Socket.IO Integration**: Poll creators receive instant, live updates on their dashboard the moment a respondent submits an answer.
- **Targeted Broadcasting**: Uses Socket.IO rooms (`poll_${id}`) to ensure data is only pushed to authorized creators currently viewing the analytics page.
- **Dynamic Visualizations**: Beautiful, interactive Bar and Doughnut charts powered by `Chart.js`, with full theme-awareness for dark/light mode execution.

### 👑 Role-Based Admin Dashboard
- **RBAC**: Secure role-based access control protecting premium analytics routes and UI components.
- **Platform Management**: Multi-tabbed configuration interface (Overview, Polls, Users, Settings) with system-wide controls like toggle-based user registration and an announcement banner system.
- **Global Metrics**: Admins get exclusive access to a premium dashboard displaying platform-wide user registrations, poll statuses, and total responses.
- **CLI Seeder**: Included developer script to instantly promote any user to an admin via the terminal.

### ✨ Premium "Tech-Forward Minimalist" Design
- **Custom Typography**: Implements Universal Sans for a highly legible, modern, and distinctive typographic hierarchy.
- **Theme-Aware UI**: Beautiful dark/light mode execution via `next-themes` with subtle glassmorphism and dynamic micro-animations.
- **Polished Dashboards**: Standardized component spacing, fixed navigation layouts, and robust CSS variable offset management ensuring a cohesive, high-performance professional experience across all views.

### 🛡️ Enterprise-Grade Security & Anti-Abuse
- **Access & Refresh Tokens**: Robust authentication architecture utilizing short-lived (15m) access tokens and long-lived (30d) refresh tokens, both stored exclusively as secure `httpOnly` cookies to prevent XSS attacks.
- **Version Invalidation**: Refresh tokens use a version incrementing mechanism enabling immediate session revocation upon password changes or remote logouts.
- **Strict Authentication**: Mandatory user authentication for all poll responses. A deterministic auth-first architecture enforcing voting integrity via compound unique database indexes.
- **Environment-Aware Rate Limiting**: Dedicated rate limiters for authentication (protecting login/register endpoints), submissions, and general API requests. Properly configured for reverse proxies (`trust proxy`).
- **Data Lifecycle Management**: MongoDB Time-To-Live (TTL) indexes automatically purge abandoned responses 30 days after submission to prevent unbounded database growth.
- **ES Modules Architecture**: Backend runs entirely on modern ES Modules (`import`/`export`), preventing module isolation issues.

### 🚀 High-Performance Architecture
- **Optimized MongoDB Aggregations**: Dashboard statistics utilize targeted `$lookup` and `$group` aggregations (O(1) database operations) rather than pulling raw documents into Node.js memory, eliminating N+1 query patterns.

---

## 🏗️ System Architecture

PollVault uses a decoupled client-server architecture managed as a single monorepo for superior Developer Experience (DX).

```mermaid
graph TD
    subgraph Frontend [Client - React/Vite]
        UI[shadcn/ui + Tailwind]
        State[React Context + next-themes]
        Charts[Chart.js]
    end

    subgraph Backend [Server - Node/ESM/Express]
        REST[REST API Controllers]
        WS[Socket.IO Singleton]
        Auth[JWT + httpOnly Cookies]
    end

    subgraph Database [MongoDB]
        Users[(Users)]
        Polls[(Polls)]
        Responses[(Responses + TTL)]
    end

    UI -->|HTTPS Req/Res| REST
    State <-->|WebSocket| WS
    REST --> Auth
    REST --> Database
    WS --> Database
```

---

## 📁 Repository Structure

```text
poll-vault/
├── client/                 # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios instance and API service wrappers
│   │   ├── components/     # Reusable UI components (shadcn, forms, charts)
│   │   ├── context/        # Auth, Theme, and Socket.IO React Context providers
│   │   ├── lib/            # Utilities (e.g., Chart.js global setup)
│   │   └── pages/          # Full-page routing components
│   └── vite.config.js      # Vite config with API proxy proxy
├── server/                 # Backend Express Application (ES Modules)
│   ├── config/             # Database connection setup
│   ├── controllers/        # Core business logic and aggregations
│   ├── middleware/         # Auth, validation (express-validator), error handling
│   ├── models/             # Mongoose schemas (User, Poll, Response)
│   ├── routes/             # Express router definitions
│   ├── scripts/            # CLI utilities (makeAdmin.js, migrateResponseMode.js)
│   ├── socket/             # WebSocket initialization and event handlers
│   ├── tests/              # Jest test suites (API Endpoints, Helpers, Auth)
│   └── utils/              # Helper functions (JWT generation)
├── Dockerfile              # Production multi-stage Docker build
├── render.yaml             # Render Blueprint for 1-click deployment
└── package.json            # Monorepo orchestration (concurrently)
```

---

## 🛠️ Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string.

### 1. Clone & Install
The project uses a root `package.json` to orchestrate installations across both the client and server.
```bash
git clone https://github.com/yourusername/poll-vault.git
cd poll-vault
npm run install:all
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/pollvault
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Start the Development Servers
Using `concurrently`, this command starts the backend and waits for the API health check to pass before launching the Vite frontend.
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:8000](http://localhost:8000)

### 4. Run Tests
The backend includes a comprehensive Jest and Supertest suite that tests full lifecycle scenarios across Auth, Admin, Polls, and System configuration endpoints. Since the backend utilizes ES Modules, tests run in experimental VM mode.
```bash
cd server
npm test
```

### 5. Create an Admin User (Optional)
To access the premium Admin Dashboard, you must promote your account to the `admin` role. After registering an account via the UI, run:
```bash
node server/scripts/makeAdmin.js your_email@example.com
```

### 6. Run Database Migrations (If Updating)
If migrating from an older version of PollVault, run the response mode migration script:
```bash
node server/scripts/migrateResponseMode.js
```

---

## 🚢 Deployment

PollVault is strictly engineered for production environments.

### Option A: Render (1-Click Deploy)
Link your GitHub repository to [Render](https://render.com) and use the provided `render.yaml` Blueprint to automatically provision the web service. You will only need to supply the `MONGO_URI` securely in the Render dashboard.

### Option B: Docker
A multi-stage `Dockerfile` is included to build and serve the entire application from a single lightweight Node Alpine container.

```bash
# Build the image
docker build -t poll-vault-prod .

# Run the container (ensure your .env has production values)
docker run -p 8000:8000 --env-file .env poll-vault-prod
```
*Note: The Dockerfile builds the Vite static assets and configures Express to serve them from `client/dist`.*

---

## 🧪 Tech Stack Details

- **Frontend Core**: React 18, Vite, React Router v6.
- **Styling**: Tailwind CSS, `shadcn/ui`, `lucide-react` icons.
- **Backend Core**: Node.js, Express.js (ES Modules).
- **Database**: MongoDB, Mongoose ODM.
- **Real-Time**: Socket.IO (v4).
- **Security**: `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`, `cookie-parser`.
- **Validation**: `express-validator`.
- **Testing**: `jest`, `@jest/globals`, `supertest`, `mongodb-memory-server`.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
