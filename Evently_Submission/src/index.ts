import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { errorHandler } from './middleware/errorHandler';

import authRoutes    from './routes/authRoutes';
import eventRoutes   from './routes/eventRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reportRoutes  from './routes/reportRoutes';
import { initializeDatabase } from './datasource';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',     authRoutes);
app.use('/events',   eventRoutes);
app.use('/bookings', bookingRoutes);
app.use('/reports',  reportRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Centralised error handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Evently API running at http://localhost:${PORT}`);
      console.log(`   POST /auth/register`);
      console.log(`   POST /auth/login`);
      console.log(`   GET  /events`);
      console.log(`   GET  /reports/q1-revenue-by-month  ...and 12 more`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
