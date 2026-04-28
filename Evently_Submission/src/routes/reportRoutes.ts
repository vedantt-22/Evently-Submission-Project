import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  q1RevenuByMonth,
  q2TopCityQ1,
  q3TopEvents,
  q4TierBreakdown,
  q5LowSeats,
  q6AvgPriceByCity,
  q7UniqueAttendees,
  q8CancelledRevenue,
  q9TopTierType,
  q10ZeroBookings,
  q11MonthlyRevenue,
  q12TopSpender,
  q13UpcomingSeatsSold,
  revenueSummary,
  attendanceByCity,
} from '../controllers/reportController';

const router = Router();
router.use(authenticate);

// Core reporting endpoints required by the spec
router.get('/revenue-summary',    revenueSummary);    // filter by date range
router.get('/attendance-by-city', attendanceByCity);  // filter by month & year
router.get('/top-events',         q3TopEvents);       // ?limit=5
router.get('/available-events',   q5LowSeats);        // events with seats

// 13 Analytical Questions
router.get('/q1-revenue-by-month',       q1RevenuByMonth);       // ?year=2025&month=1
router.get('/q2-top-city-by-quarter',    q2TopCityQ1);           // ?year=2025&quarter=1
router.get('/q3-top-events',             q3TopEvents);           // ?limit=3
router.get('/q4-tier-breakdown',         q4TierBreakdown);       // ?eventTitle=Tech Summit 2025
router.get('/q5-low-seat-events',        q5LowSeats);            // ?threshold=10
router.get('/q6-avg-price-by-city',      q6AvgPriceByCity);
router.get('/q7-unique-attendees',       q7UniqueAttendees);     // ?organizerId=1
router.get('/q8-cancelled-revenue',      q8CancelledRevenue);
router.get('/q9-top-tier-type',          q9TopTierType);
router.get('/q10-zero-booking-events',   q10ZeroBookings);
router.get('/q11-monthly-trend',         q11MonthlyRevenue);     // ?year=2025
router.get('/q12-top-spender',           q12TopSpender);
router.get('/q13-upcoming-fill-rate',    q13UpcomingSeatsSold);

export default router;
