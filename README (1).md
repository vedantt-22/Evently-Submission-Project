# 🎟️ Evently — Event Management & Ticketing REST API

A fully-featured REST API built with **Node.js**, **TypeScript**, **Express**, and **TypeORM** — backed by a **SQLite** database. Evently handles the complete lifecycle of event management: user authentication, event creation, tiered ticketing, atomic booking transactions, and 13 analytical reporting queries.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Events](#events)
  - [Ticket Tiers](#ticket-tiers)
  - [Bookings](#bookings)
  - [Reports](#reports)
- [Analytical Reports (13 Queries)](#analytical-reports-13-queries)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Overview

Evently is a backend API that models a real-world event ticketing platform. Organisers can create and publish events with multiple ticket tiers, attendees can book tickets atomically (with seat deduction handled in a DB transaction), and a rich reporting layer answers 13 analytical business questions — from revenue by month to fill-rate forecasting for upcoming events.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 4 |
| ORM | TypeORM 0.3 |
| Database | SQLite (via `sql.js` / `better-sqlite3`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Validation | `express-validator` |
| Dev Server | `ts-node-dev` |

---

## Project Structure

```
src/
├── controllers/
│   ├── authController.ts        # Register & login
│   ├── eventController.ts       # Event & tier CRUD
│   ├── bookingController.ts     # Atomic booking & cancellation
│   └── reportController.ts      # 13 analytical queries + 2 bonus reports
├── entities/
│   ├── User.ts
│   ├── Event.ts
│   ├── TicketTier.ts
│   └── Booking.ts
├── middleware/
│   ├── auth.ts                  # JWT authentication guard
│   ├── errorHandler.ts          # Centralised error handling
│   └── validate.ts              # express-validator middleware
├── migrations/
│   └── 1700000000000-InitialSchema.ts
├── routes/
│   ├── authRoutes.ts
│   ├── eventRoutes.ts
│   ├── bookingRoutes.ts
│   └── reportRoutes.ts
├── seeds/
│   └── seed.ts                  # Database seeder
├── datasource.ts                # TypeORM DataSource config
└── index.ts                     # Express app entry point
```

---

## Data Model

Four TypeORM entities with full relational mapping:

```
Users
  │
  ├──< Events (organizer_id)
  │       │
  │       └──< TicketTiers (event_id)
  │                 │
  └──< Bookings >───┘  (user_id, event_id, tier_id)
```

### Entities

**User** — `id`, `name`, `email` (unique), `password` (hashed), `createdAt`, `updatedAt`

**Event** — `id`, `title`, `description`, `venueName`, `city`, `startDate`, `endDate`, `status` (`draft` | `published` | `cancelled`), `organizerId`

**TicketTier** — `id`, `name`, `price`, `totalCapacity`, `availableSeats`, `isAvailable`, `eventId`

**Booking** — `id`, `userId`, `eventId`, `tierId`, `quantity`, `totalPrice`, `status` (`confirmed` | `cancelled`)

---

## API Endpoints

All routes except `/auth/*` and `/health` require a `Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT |

**Register body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Login response:**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Alice", "email": "alice@example.com" } }
```

---

### Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | List all events |
| `GET` | `/events/:id` | Get a single event with its tiers |
| `POST` | `/events` | Create a new event |
| `PUT` | `/events/:id` | Update event details |
| `DELETE` | `/events/:id` | Cancel an event |

**Create event body:**
```json
{
  "title": "Tech Summit 2025",
  "description": "Annual tech conference",
  "venueName": "NSCI Dome",
  "city": "Mumbai",
  "startDate": "2025-09-15T09:00:00Z",
  "endDate": "2025-09-15T18:00:00Z",
  "status": "draft"
}
```

---

### Ticket Tiers

Managed as sub-resources under `/events/:id/tiers`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events/:id/tiers` | Add a ticket tier to an event |
| `PUT` | `/events/:id/tiers/:tierId` | Update tier price or capacity |
| `DELETE` | `/events/:id/tiers/:tierId` | Remove a tier |

**Add tier body:**
```json
{ "name": "VIP", "price": 2999.00, "totalCapacity": 100 }
```

---

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/bookings` | Get the logged-in user's bookings |
| `POST` | `/bookings` | Book tickets (atomic transaction) |
| `DELETE` | `/bookings/:id` | Cancel a booking (seats are restored) |

**Create booking body:**
```json
{ "eventId": 1, "tierId": 2, "quantity": 3 }
```

> Booking creation and cancellation are wrapped in **database transactions** — seat counts are atomically deducted or restored and the system validates event status, tier availability, and seat count before confirming.

---

### Reports

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/reports/revenue-summary` | `from`, `to` | Revenue per event, filterable by date range |
| `GET` | `/reports/attendance-by-city` | `month`, `year` | Attendees per city, filterable by month/year |
| `GET` | `/reports/top-events` | `limit` | Top N best-selling events |
| `GET` | `/reports/available-events` | `threshold` | Events with seats below a threshold |

---

## Analytical Reports (13 Queries)

All report endpoints are authenticated and return structured JSON.

| Endpoint | Query Params | Description |
|---|---|---|
| `GET /reports/q1-revenue-by-month` | `year`, `month` | Total revenue and tickets sold for a given month |
| `GET /reports/q2-top-city-by-quarter` | `year`, `quarter` | City ranking by tickets sold in a quarter |
| `GET /reports/q3-top-events` | `limit` | Top N best-selling events of all time |
| `GET /reports/q4-tier-breakdown` | `eventTitle` | Tickets sold per tier + revenue % share for an event |
| `GET /reports/q5-low-seat-events` | `threshold` | Events with fewer than N seats remaining |
| `GET /reports/q6-avg-price-by-city` | — | Average ticket price per city (published events only) |
| `GET /reports/q7-unique-attendees` | `organizerId` | Count of unique attendees for a specific organiser |
| `GET /reports/q8-cancelled-revenue` | — | Cancelled bookings per event and potential revenue lost |
| `GET /reports/q9-top-tier-type` | — | Tier name generating the most revenue across all events |
| `GET /reports/q10-zero-booking-events` | — | Published events with zero confirmed bookings |
| `GET /reports/q11-monthly-trend` | `year` | Month-over-month revenue and ticket trend |
| `GET /reports/q12-top-spender` | — | Top 10 users by total spend on confirmed bookings |
| `GET /reports/q13-upcoming-fill-rate` | — | Seat fill rate (%) for events in the next 30 days |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vedantt-22/Evently-TypeORM.git
   cd Evently-TypeORM/Evently_Submission
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values (see Environment Variables below)
   ```

4. **Run migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed the database** *(optional)*
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be running at `http://localhost:3001`

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled build |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert the last migration |
| `npm run seed` | Seed the database with sample data |

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
DB_PATH=./evently.db
NODE_ENV=development
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `JWT_SECRET` | Secret key for signing JWTs | *(required)* |
| `JWT_EXPIRES_IN` | JWT token expiry duration | `7d` |
| `DB_PATH` | Path to the SQLite database file | `./evently.db` |
| `NODE_ENV` | Environment mode | `development` |

---

> Built as a full-stack TypeORM project demonstrating REST API design, ORM-based migrations, transactional data integrity, and SQL-backed analytics.
