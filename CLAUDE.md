# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VENTOUT is a French-language e-commerce application for electronics and home appliances. It uses React + Vite on the frontend and an Express + Socket.IO server in development.

## Commands

- **Dev server:** `npm run dev` — runs `tsx server.ts` (Express server with Vite middleware on port 3000)
- **Build:** `npm run build` — Vite production build
- **Type check:** `npm run lint` — `tsc --noEmit` (no ESLint configured)

## Architecture

### Server (`server.ts`)
Express + Socket.IO server that embeds Vite as middleware in dev mode. Socket.IO handles real-time order notifications (`new_order` → `order_notification` broadcast). In production, serves static files from `dist/`.

### Frontend (`src/`)
- **React 19 + React Router v7** — SPA with routes: `/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/profile`, `/admin`, `/login`, `/register`
- **State:** Zustand (`src/store.ts`) with `persist` middleware for cart (persisted to localStorage as `cart-storage`)
- **Auth:** Supabase Auth via `AuthContext` (`src/context/AuthContext.tsx`) — email/password only (Google OAuth disabled). Profile auto-created on signup via DB trigger + client fallback
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin, plus `tailwind-merge` and `clsx` for class composition
- **Animations:** `motion` (Framer Motion)
- **Icons:** `lucide-react`
- **Charts:** `recharts` (admin dashboard)
- **Real-time:** Socket.IO client (`src/socket.ts`) connects to `window.location.origin`

### Data Layer
- **Backend:** Supabase (auth + Postgres). Product/category data is also hardcoded in `src/constants.ts` as fallback
- **Database schema:** `supabase/migrations/20240314000000_initial_schema.sql` — tables: `categories`, `products`, `profiles`, `orders`, `settings`. All tables have RLS enabled with admin/user policies
- **User roles:** `admin` | `user` stored in `profiles.role`. Admin access checked via `useAuth().isAdmin`

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key


### Key Patterns
- UI text is in French throughout
- Prices are stored as integers (CFA francs, no decimals)
- Path alias: `@` resolves to project root
- Types defined in `src/types.ts` (Product, CartItem, Order, Category, UserProfile, AppSettings, Slide, FrontendContent)
