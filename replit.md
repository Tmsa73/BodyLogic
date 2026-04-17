# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, React Query, Framer Motion)

## Artifacts

### Health & Fitness Tracker (`artifacts/health-app`)
- **URL**: `/` (root, port 3000)
- **Type**: react-vite web app (mobile-style layout, max 430px)
- **Description**: Full-stack AI-powered personal health companion with 6 sections:
  1. **Home** – Momentum Score + Life Balance side-by-side, 4 stat cards, XP/coins banner, water quick-add, clickable Meal IQ quiz card, AI tip (rotates every 10 min), improved streak calendar, recent activity, active title display
  2. **Nutrition** – Meal logger, calorie/macro progress rings, clickable Meal IQ quiz card (35 randomized questions), streak badge, add meal button (camera/photo scan consolidated inside dialog + food search autocomplete with 150+ foods that pre-fills all macros), today's meals list; food image AI recognizes global + Arabian cuisines
  3. **Fitness** – Weekly activity chart, workout logger, calories burned, sleep recovery card
  4. **AI Coach** – Conversational AI with personality badge (Motivator/Friendly/Strict/Silent), collapsible habit warning panel, 8 topic chips
  5. **History** – Filterable timeline of all logged events (meals, workouts, sleep)
  6. **Profile** – Health Identity Card (level, title, xp bar, stats), Life Balance chart, daily missions, earned badges, body metrics editor

### API Server (`artifacts/api-server`)
- **URL**: `/api` (port 8080)
- **Type**: Express 5 API server
- **Routes**: profile, nutrition (meals), fitness (workouts), sleep, ai (messages + insights), history, dashboard, progress/missions

## Gamification System (`lib/gamification.ts`)

All gamification logic lives in the frontend lib:
- **80+ achievements** across 6 categories: nutrition, fitness, ai, milestones, elite, lifestyle
- **5 badge tiers**: bronze, silver, gold, platinum, legendary
- **19 unlockable titles** with glow effects and category colors
- **30-level progression** with thresholds from 0 to 525K XP
- **Daily/Weekly/Personal/Boss missions**: 8 + 7 + 8 + 8 entries
- **`calcMomentumScore()`**: composite health score (0–100) based on streak, workouts, meals, water, sleep

## Gamification Pages

### Achievements (`/achievements`)
- **Badges tab**: Category + tier filters, animated 2-col grid with lock/unlock states, per-category completion %
- **Titles tab**: Unlockable titles by level, glow effects, ACTIVE indicator
- **Missions tab**: Daily, Weekly, Personal sub-tabs with progress bars and difficulty badges
- **Boss tab**: Extreme multi-day challenges with XP/coin rewards

## Settings (`/settings`)
- **AI Personality**: preset personality modes plus custom free-text style
- **Diet Preferences**: preset diet types plus custom free-text diet
- **Health Conditions**: Multi-select toggleable grid with custom free-text notes
- **Daily Goals**: 4 sliders (steps, calories, water, sleep)
- **Appearance**: 5 themes (Dark, Light, System, Energy, Focus) with color preview squares
- **Language**: English / Arabic with RTL flag indicator
- **Notifications**: Master toggle + 5 individual toggles with smooth animation
- **Sound & Haptics**, **Data & Privacy**, **About** sections

## Database Schema

- `profile` – User profile with goals, weight, height, calorie targets
- `meals` – Food log entries with macros
- `workouts` – Workout log with type, duration, intensity, calories
- `sleep` – Sleep logs with bedtime, wake time, duration, quality
- `ai_messages` – AI coach conversation history
- `xp_logs` – XP earn events by source

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- Start API: `PORT=8080 BASE_PATH=/api pnpm --filter @workspace/api-server run dev`
- Start App: `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/health-app run dev`

## Replit Runtime Configuration

- Active workflows:
  - `artifacts/api-server: API Server` serves `/api` on local port 8080.
  - `artifacts/health-app: web` serves `/` on local port 3000.
- Legacy duplicate workflows were removed during migration so the registered Replit artifact services own their expected ports.
- `artifacts/health-app/.replit-artifact/artifact.toml` is registered with `localPort = 3000` and `BASE_PATH = "/"`.
- Verified migration with HTTP 200 responses from `/` and `/api/healthz`, and browser console showed Vite reconnecting without runtime errors.

## Important Notes

- Frontend uses local `calcMomentumScore()` — no backend needed
- Settings state is local only (not persisted to API) except profile metrics
- Mission field names in API response: `progress`, `target` (not `currentValue`/`targetValue`)
- Home page has a local `Minus` SVG function — do NOT import Minus from lucide-react
- AI Coach personality mode is local state (Settings → AI Personality changes it)
- Achievements page reads from `ALL_ACHIEVEMENTS` (gamification.ts) with server badge overlay
- Sound effects are stored in `localStorage` under `bodylogic-sound-effects` and are used for XP, level-up, and achievement moments
