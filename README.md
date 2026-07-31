# AeroArcade — Probability Arena

> **Learn probability through play** — A casino-style arcade and probability-learning platform built with NestJS and Next.js.

AeroArcade is a full-stack monorepo that combines real-time probability games with structured educational content. Players learn concepts like expected value, variance, and the gambler's fallacy by playing games, then reinforce their knowledge through interactive lessons and quizzes. Practice points (not real money) keep the focus on learning.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AeroArcade Monorepo                       │
│                                                             │
│  ┌──────────────┐          ┌──────────────────────────┐    │
│  │   Frontend    │◄────────►│        Backend            │    │
│  │   (Next.js)   │   HTTP   │        (NestJS)           │    │
│  │   :3000       │◄────────►│        :4000              │    │
│  │               │ WebSocket│                          │    │
│  └──────┬───────┘          └──────┬───────────────────┘    │
│         │                         │                        │
│         │                    ┌────▼────┐  ┌──────▼──────┐  │
│         │                    │PostgreSQL│  │    Redis     │  │
│         │                    │  :5432   │  │    :6379     │  │
│         │                    └─────────┘  └─────────────┘  │
│         │                                                  │
│    ┌────▼───────┐                                          │
│    │   Docker    │                                          │
│    │ Desktop     │                                          │
│    └────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | Server-rendered React UI |
| | Tailwind CSS | Utility-first styling |
| | Framer Motion | Animations & transitions |
| | Zustand | State management |
| | Socket.IO Client | Real-time game updates |
| | React Hook Form + Zod | Form validation |
| | Recharts | Data visualizations |
| | i18next (en/ur) | Internationalization |
| **Backend** | NestJS 10 | Modular Node.js framework |
| | Prisma ORM | Type-safe database access |
| | PostgreSQL 16 | Primary data store |
| | Redis 7 | Session cache & rate limiting |
| | Socket.IO | WebSocket game engine |
| | Passport.js + JWT | Authentication |
| | Argon2 / bcrypt | Password hashing |
| | Helmet | Security headers |
| | Class-validator | Input validation |
| | Swagger / OpenAPI | API documentation |
| **Infrastructure** | Docker & Docker Compose | Container orchestration |
| | Nginx | Reverse proxy (production) |
| | Let's Encrypt | SSL certificates |
| | GitHub Actions | CI/CD |

---

## Features

### Games
- **Flight Curve** — Predict trajectory and cash out before the crash. Learn about exponential growth and risk management.
- **Dice** — Classic dice roll with configurable sides. Understand uniform distribution.
- **Coin Flip** — 50/50 odds. The simplest introduction to probability.
- **Slots** — Multi-reel slot machine with symbol matching. Teaches compound probability.
- **Wheel** — Spin the wheel of fortune with configurable segments. Expected value in action.
- **Card Trainer** — Card counting practice with a single deck. Conditional probability.

### Educational Content
- **Interactive Lessons** — Structured curriculum covering independent events, randomness, house advantage, expected value, variance, and the gambler's fallacy.
- **Quizzes** — Test knowledge after each lesson with auto-graded multiple-choice questions.
- **Practice Points** — Virtual currency with daily resets. No real-money gambling.

### Gamification
- **Achievements** — 7 unlockable achievements with point rewards.
- **Daily & Weekly Challenges** — Complete objectives for bonus points.
- **Leaderboard** — Daily, weekly, and all-time rankings per game.
- **Progress Tracking** — Detailed game history and statistics.

### User Features
- **Guest Mode** — Play without registration (feature-flagged).
- **Account System** — Email registration with email verification.
- **Two-Factor Authentication** — TOTP-based 2FA support.
- **User Preferences** — Language (English/Urdu), theme, sound, reduced motion, session timer.
- **Session Management** — View and revoke active sessions.
- **Support Tickets** — Submit and track support requests.

### Security
- Argon2 password hashing (bcrypt fallback)
- HTTP-only secure cookies for JWT refresh tokens
- Rate limiting (100 requests/minute general, 30/s API)
- CSRF protection via same-site cookies
- Input validation with whitelist mode
- Helmet security headers
- Prisma parameterized queries (SQL injection prevention)
- Admin audit logging
- Role-based access control (User / Admin)
- Safe error messages (no stack traces exposed)

---

## Prerequisites

- **Node.js** 20.x or later ([download](https://nodejs.org/))
- **Docker Desktop** 4.x or later ([download](https://www.docker.com/products/docker-desktop/))
- **PostgreSQL** 16 (provided via Docker)
- **Redis** 7 (provided via Docker)
- **Git** ([download](https://git-scm.com/downloads/win))

Verify your environment:

```powershell
node --version
npm --version
docker --version
docker compose version
```

---

## Development Setup (Windows PowerShell)

### 1. Clone the Repository

```powershell
git clone https://github.com/your-org/probability-arena.git
cd probability-arena
```

### 2. Configure Environment Variables

```powershell
Copy-Item .env.example .env
```

Edit `.env` to customize settings (defaults work for local development).

### 3. Start Docker Services

```powershell
docker compose -f docker\docker-compose.yml up -d postgres redis
```

This starts PostgreSQL (port 5432) and Redis (port 6379) in detached mode. Verify they are healthy:

```powershell
docker ps
```

### 4. Install Backend Dependencies

```powershell
cd backend
npm install
cd ..
```

### 5. Run Prisma Migrations & Seed

```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

This creates database tables, applies migrations, and populates seed data (users, games, achievements, lessons, challenges, announcements, feature flags).

### 6. Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

### 7. Start Development Servers

Option A — Start both servers concurrently:

```powershell
npm run dev
```

Option B — Start individually in separate terminals:

```powershell
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm run start:dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend
npm run dev
```

### 8. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| Swagger Docs | http://localhost:4000/api/docs |
| PostgreSQL | postgresql://localhost:5432 (via docker) |
| Redis | redis://localhost:6379 (via docker) |

### 9. Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@probabilityarena.com | Admin123! |
| Demo User | demo@probabilityarena.com | Demo123! |

---

## Available NPM Scripts

### Root (`package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:backend` | Start backend in watch mode |
| `npm run dev:frontend` | Start frontend in watch mode |
| `npm run build` | Build both backend and frontend |
| `npm test` | Run all tests (backend + frontend) |
| `npm run lint` | Lint all code |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run docker:up` | Start all Docker services |
| `npm run docker:down` | Stop all Docker services |

### Backend (`backend/package.json`)

| Script | Description |
|--------|-------------|
| `npm run start` | Start production backend |
| `npm run start:dev` | Start backend in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run unit tests (Jest) |
| `npm run lint` | Lint backend code |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run dev migrations |
| `npm run prisma:seed` | Seed database |

### Frontend (`frontend/package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start production frontend |
| `npm run lint` | Run Next.js lint |
| `npm test` | Run unit tests (Jest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

---

## Project Structure

```
probability-arena/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (17 models, 14 enums)
│   │   └── seed.ts                # Database seeder
│   ├── src/
│   │   ├── main.ts                # NestJS entry point
│   │   ├── app.module.ts          # Root module with ThrottlerGuard
│   │   ├── admin/                 # Admin panel logic
│   │   ├── auth/                  # Auth (JWT, 2FA, email verification)
│   │   ├── challenges/            # Daily/weekly challenge system
│   │   ├── common/                # Guards, decorators, interceptors, filters
│   │   ├── education/             # Lessons & quizzes
│   │   ├── games/                 # Game engine + all game types
│   │   │   ├── card-trainer/
│   │   │   ├── coin-flip/
│   │   │   ├── dice/
│   │   │   ├── flight-curve/
│   │   │   ├── slots/
│   │   │   └── wheel/
│   │   ├── leaderboard/           # Per-game leaderboard service
│   │   ├── notifications/         # User notification system
│   │   ├── prisma/                # Prisma client module
│   │   ├── redis/                 # Redis connection module
│   │   ├── support/               # Support ticket system
│   │   ├── users/                 # User profile management
│   │   └── wallet/                # Practice point wallet
│   ├── test/
│   │   ├── unit/                  # Unit tests (auth, games, users, etc.)
│   │   └── jest-e2e.json          # E2E test config
│   ├── scripts/
│   │   ├── setup.ps1              # Windows dev setup script
│   │   └── migrate.ps1            # Windows migration script
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
├── docker/
│   ├── docker-compose.yml         # PostgreSQL + Redis + Backend + Frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx.conf                 # Production reverse proxy config
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── games/             # BetControls, BalanceDisplay, RoundHistory
│   │   │   ├── layout/            # Header, Sidebar, Footer, MainLayout
│   │   │   └── ui/                # Button, Card, Modal, Input, Tabs, etc.
│   │   ├── locales/               # en.json (English), ur.json (Urdu)
│   │   ├── store/                 # Zustand stores (auth, game, preferences)
│   │   ├── styles/globals.css     # Global Tailwind styles
│   │   └── types/index.ts         # TypeScript type definitions
│   ├── public/
│   ├── .eslintrc.json
│   ├── next.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml                 # CI pipeline
│       └── deploy.yml             # Deployment pipeline
├── .env.example
├── .gitignore
├── package.json                   # Root monorepo scripts
├── README.md
├── SECURITY.md
├── ACCESSIBILITY.md
└── DEPLOYMENT.md
```

---

## Database Schema

The data layer uses PostgreSQL with Prisma ORM. Key models:

| Model | Description |
|-------|-------------|
| `User` | User accounts with roles, 2FA, soft-delete |
| `Session` | JWT refresh token sessions |
| `UserPreference` | Per-user settings (theme, language, etc.) |
| `PracticeWallet` | Virtual currency wallet per user |
| `PracticeTransaction` | Wallet credit/debit ledger |
| `Game` | Game definitions (slug, config, category) |
| `GameRound` | Individual game plays with bets & payouts |
| `GameResult` | Provably fair game results with seeds |
| `Achievement` | Achievement definitions with criteria |
| `UserAchievement` | Unlocked achievements per user |
| `Challenge` | Daily/weekly challenge definitions |
| `ChallengeProgress` | User progress on challenges |
| `LeaderboardEntry` | Per-game, per-period scores |
| `EducationalLesson` | Learning modules with content |
| `Quiz` | Quiz questions linked to lessons |
| `QuizAttempt` | User quiz completion records |
| `Notification` | Per-user notifications |
| `SupportTicket` | User support requests |
| `AdminAuditLog` | Administrative action audit trail |
| `AccountRestriction` | Cooldowns, self-locks, suspensions |
| `Announcement` | Platform-wide announcements |
| `FeatureFlag` | Toggle features on/off |

---

## Troubleshooting (Windows)

### "docker compose" not found
Use the legacy syntax:
```powershell
docker-compose up -d
```

### Port conflicts (5432, 6379, 3000, 4000)
Stop services using those ports:
```powershell
netstat -ano | findstr :5432
# Get PID from output, then:
taskkill /PID <PID> /F
```

Or change ports in `.env` and `docker-compose.yml`.

### Prisma migration fails on Windows
Ensure PostgreSQL is healthy first:
```powershell
docker logs aeroarcade-postgres
```

If the database container was restarted, reset the volume:
```powershell
docker compose -f docker\docker-compose.yml down -v
docker compose -f docker\docker-compose.yml up -d postgres redis
```

### "node_modules" permission errors
Clear cache and retry:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force frontend\node_modules
Remove-Item -Recurse -Force backend\node_modules
npm cache clean --force
npm install
```

### Backend watch mode crashes on file change
Windows file watchers can be flaky. Restart the process or use:
```powershell
$env:CHOKIDAR_USEPOLLING = "true"
```

### "Nest" not recognized
Install NestJS CLI globally:
```powershell
npm install -g @nestjs/cli
```

### Docker Desktop requires WSL2
Follow the [Docker Desktop WSL 2 backend setup](https://docs.docker.com/desktop/wsl/). After installation, ensure WSL2 is the default:
```powershell
wsl --set-default-version 2
```

---

## Docker Production Deployment

```powershell
# Build and start all services
docker compose -f docker\docker-compose.yml --env-file .env up -d --build

# Run migrations on the production database
docker exec aeroarcade-backend npx prisma migrate deploy

# View logs
docker compose -f docker\docker-compose.yml logs -f

# Stop all services
docker compose -f docker\docker-compose.yml down
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full production deployment guide.

---

## Quick Setup (Automated)

For a fresh Windows development environment, run the setup script:

```powershell
# From the repository root
powershell -ExecutionPolicy Bypass -File backend\scripts\setup.ps1
```

This script checks prerequisites, copies `.env`, starts Docker containers, installs dependencies, runs migrations, seeds the database, and prints access URLs.

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Credits

Developed as an educational tool for learning probability and statistics through interactive gameplay. Built with NestJS, Next.js, Prisma, PostgreSQL, Redis, and Docker.
