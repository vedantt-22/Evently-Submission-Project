import { Response, NextFunction } from 'express';
import { AppDataSource } from '../datasource';
import { Booking } from '../entities/Booking';
import { Event } from '../entities/Event';
import { TicketTier } from '../entities/TicketTier';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

// ── Q1: Total revenue from events held in January 2025 ────────────────────────
export async function q1RevenuByMonth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year = 2025, month = 1 } = req.query;
    const startOf = `${year}-${String(month).padStart(2,'0')}-01`;
    const endOf   = `${year}-${String(Number(month)+1).padStart(2,'0')}-01`;

    const result = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('SUM(booking.total_price)', 'totalRevenue')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'confirmed' })
      .andWhere('event.start_date >= :startOf', { startOf })
      .andWhere('event.start_date < :endOf', { endOf })
      .getRawOne();

    res.json({
      query: 'Q1 — Total revenue from events held in a given month',
      filters: { year, month },
      totalRevenue: Number(result.totalRevenue) || 0,
      totalTickets: Number(result.totalTickets) || 0,
    });
  } catch (err) { next(err); }
}

// ── Q2: City with highest tickets sold in Q1 2025 ─────────────────────────────
export async function q2TopCityQ1(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year = 2025, quarter = 1 } = req.query;
    const q = Number(quarter);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth   = q * 3;
    const startOf = `${year}-${String(startMonth).padStart(2,'0')}-01`;
    const endOf   = `${year}-${String(endMonth + 1).padStart(2,'0')}-01`;

    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('event.city', 'city')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'confirmed' })
      .andWhere('event.start_date >= :startOf', { startOf })
      .andWhere('event.start_date < :endOf', { endOf })
      .groupBy('event.city')
      .orderBy('totalTickets', 'DESC')
      .getRawMany();

    res.json({
      query: 'Q2 — City with highest tickets sold in a given quarter',
      filters: { year, quarter },
      ranking: results.map(r => ({ city: r.city, totalTickets: Number(r.totalTickets) })),
    });
  } catch (err) { next(err); }
}

// ── Q3: Top N best-selling events of all time ─────────────────────────────────
export async function q3TopEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 50);

    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.city', 'city')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .addSelect('SUM(booking.total_price)', 'totalRevenue')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'confirmed' })
      .groupBy('event.id')
      .orderBy('totalTickets', 'DESC')
      .limit(limit)
      .getRawMany();

    res.json({
      query: 'Q3 — Top best-selling events of all time',
      limit,
      results: results.map((r, i) => ({
        rank: i + 1,
        eventId: r.eventId,
        title: r.title,
        city: r.city,
        totalTickets: Number(r.totalTickets),
        totalRevenue: Number(r.totalRevenue),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q4: Bookings per tier + revenue % for a given event ───────────────────────
export async function q4TierBreakdown(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { eventTitle = 'Tech Summit 2025' } = req.query;

    const rows = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('tier.id', 'tierId')
      .addSelect('tier.name', 'tierName')
      .addSelect('tier.price', 'tierPrice')
      .addSelect('SUM(booking.quantity)', 'ticketsSold')
      .addSelect('SUM(booking.total_price)', 'tierRevenue')
      .innerJoin('booking.tier', 'tier')
      .innerJoin('booking.event', 'event')
      .where('event.title = :eventTitle', { eventTitle })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .groupBy('tier.id')
      .orderBy('tierRevenue', 'DESC')
      .getRawMany();

    const grandTotal = rows.reduce((sum, r) => sum + Number(r.tierRevenue), 0);

    res.json({
      query: 'Q4 — Tickets sold per tier + revenue % for an event',
      event: eventTitle,
      totalRevenue: grandTotal,
      tiers: rows.map(r => ({
        tierId: r.tierId,
        tierName: r.tierName,
        price: Number(r.tierPrice),
        ticketsSold: Number(r.ticketsSold),
        tierRevenue: Number(r.tierRevenue),
        revenuePercent: grandTotal > 0
          ? ((Number(r.tierRevenue) / grandTotal) * 100).toFixed(2) + '%'
          : '0%',
      })),
    });
  } catch (err) { next(err); }
}

// ── Q5: Events with fewer than N seats remaining ──────────────────────────────
export async function q5LowSeats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const results = await AppDataSource
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.city', 'city')
      .addSelect('event.status', 'status')
      .addSelect('event.start_date', 'startDate')
      .addSelect('SUM(tier.available_seats)', 'totalAvailable')
      .innerJoin('event.tiers', 'tier')
      .where('event.status != :cancelled', { cancelled: 'cancelled' })
      .groupBy('event.id')
      .having('totalAvailable < :threshold', { threshold })
      .orderBy('totalAvailable', 'ASC')
      .getRawMany();

    res.json({
      query: `Q5 — Events with fewer than ${threshold} seats remaining`,
      threshold,
      count: results.length,
      events: results.map(r => ({
        eventId: r.eventId,
        title: r.title,
        city: r.city,
        status: r.status,
        startDate: r.startDate,
        seatsRemaining: Number(r.totalAvailable),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q6: Average ticket price per city for published events ────────────────────
export async function q6AvgPriceByCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await AppDataSource
      .getRepository(TicketTier)
      .createQueryBuilder('tier')
      .select('event.city', 'city')
      .addSelect('AVG(tier.price)', 'avgPrice')
      .addSelect('COUNT(tier.id)', 'tierCount')
      .innerJoin('tier.event', 'event')
      .where('event.status = :status', { status: 'published' })
      .groupBy('event.city')
      .orderBy('avgPrice', 'DESC')
      .getRawMany();

    res.json({
      query: 'Q6 — Average ticket price by city (published events)',
      results: results.map(r => ({
        city: r.city,
        avgPrice: parseFloat(Number(r.avgPrice).toFixed(2)),
        tierCount: Number(r.tierCount),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q7: Unique attendees for a specific organiser ─────────────────────────────
export async function q7UniqueAttendees(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { organizerId } = req.query;
    if (!organizerId) {
      res.status(400).json({ message: 'organizerId query param is required' });
      return;
    }

    const result = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('COUNT(DISTINCT booking.user_id)', 'uniqueAttendees')
      .innerJoin('booking.event', 'event')
      .where('event.organizer_id = :organizerId', { organizerId })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .getRawOne();

    const organizer = await AppDataSource.getRepository(User).findOne({
      where: { id: Number(organizerId) },
      select: ['id', 'name', 'email'],
    });

    res.json({
      query: 'Q7 — Unique attendees for a specific organiser',
      organizer,
      uniqueAttendees: Number(result.uniqueAttendees),
    });
  } catch (err) { next(err); }
}

// ── Q8: Cancelled bookings per event + lost revenue ──────────────────────────
export async function q8CancelledRevenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('COUNT(booking.id)', 'cancelledBookings')
      .addSelect('SUM(booking.total_price)', 'lostRevenue')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'cancelled' })
      .groupBy('event.id')
      .orderBy('lostRevenue', 'DESC')
      .getRawMany();

    res.json({
      query: 'Q8 — Cancelled bookings per event + potential revenue lost',
      results: results.map(r => ({
        eventId: r.eventId,
        title: r.title,
        cancelledBookings: Number(r.cancelledBookings),
        lostRevenue: Number(r.lostRevenue),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q9: Tier type generating most revenue across all events ───────────────────
export async function q9TopTierType(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('tier.name', 'tierName')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .addSelect('SUM(booking.total_price)', 'totalRevenue')
      .innerJoin('booking.tier', 'tier')
      .where('booking.status = :status', { status: 'confirmed' })
      .groupBy('tier.name')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    res.json({
      query: 'Q9 — Revenue by tier type (name) across all events',
      results: results.map(r => ({
        tierName: r.tierName,
        totalTickets: Number(r.totalTickets),
        totalRevenue: Number(r.totalRevenue),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q10: Published events with zero bookings ──────────────────────────────────
export async function q10ZeroBookings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await AppDataSource
      .getRepository(Event)
      .createQueryBuilder('event')
      .leftJoin(
        'bookings',
        'booking',
        'booking.event_id = event.id AND booking.status = :status',
        { status: 'confirmed' }
      )
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.city', 'city')
      .addSelect('event.start_date', 'startDate')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .where('event.status = :evStatus', { evStatus: 'published' })
      .groupBy('event.id')
      .having('bookingCount = 0')
      .orderBy('event.start_date', 'ASC')
      .getRawMany();

    res.json({
      query: 'Q10 — Published events with zero confirmed bookings',
      count: results.length,
      events: results.map(r => ({
        eventId: r.eventId,
        title: r.title,
        city: r.city,
        startDate: r.startDate,
      })),
    });
  } catch (err) { next(err); }
}

// ── Q11: Month-over-month revenue trend for 2025 ─────────────────────────────
export async function q11MonthlyRevenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year = 2025 } = req.query;

    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select("strftime('%Y-%m', booking.createdAt)", 'month')
      .addSelect('SUM(booking.total_price)', 'revenue')
      .addSelect('SUM(booking.quantity)', 'tickets')
      .where('booking.status = :status', { status: 'confirmed' })
      .andWhere("strftime('%Y', booking.createdAt) = :year", { year: String(year) })
      .groupBy("strftime('%Y-%m', booking.createdAt)")
      .orderBy('month', 'ASC')
      .getRawMany();

    res.json({
      query: 'Q11 — Month-over-month revenue trend',
      year,
      trend: results.map(r => ({
        month: r.month,
        revenue: Number(r.revenue),
        tickets: Number(r.tickets),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q12: Top spender (user who spent most on non-cancelled bookings) ──────────
export async function q12TopSpender(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('user.id', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('SUM(booking.total_price)', 'totalSpent')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .innerJoin('booking.user', 'user')
      .where('booking.status = :status', { status: 'confirmed' })
      .groupBy('user.id')
      .orderBy('totalSpent', 'DESC')
      .limit(10)
      .getRawMany();

    res.json({
      query: 'Q12 — Top spenders (users by total spend on confirmed bookings)',
      results: results.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        name: r.name,
        email: r.email,
        totalSpent: Number(r.totalSpent),
        totalTickets: Number(r.totalTickets),
      })),
    });
  } catch (err) { next(err); }
}

// ── Q13: % of seats sold for events in next 30 days ──────────────────────────
export async function q13UpcomingSeatsSold(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date().toISOString();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const results = await AppDataSource
      .getRepository(Event)
      .createQueryBuilder('event')
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.city', 'city')
      .addSelect('event.start_date', 'startDate')
      .addSelect('SUM(tier.total_capacity)', 'totalCapacity')
      .addSelect('SUM(tier.total_capacity - tier.available_seats)', 'seatsSold')
      .innerJoin('event.tiers', 'tier')
      .where('event.status = :status', { status: 'published' })
      .andWhere('event.start_date >= :now', { now })
      .andWhere('event.start_date <= :in30', { in30 })
      .groupBy('event.id')
      .orderBy('event.start_date', 'ASC')
      .getRawMany();

    res.json({
      query: 'Q13 — Seat fill rate for events in the next 30 days',
      events: results.map(r => {
        const totalCapacity = Number(r.totalCapacity);
        const seatsSold = Number(r.seatsSold);
        return {
          eventId: r.eventId,
          title: r.title,
          city: r.city,
          startDate: r.startDate,
          totalCapacity,
          seatsSold,
          seatsAvailable: totalCapacity - seatsSold,
          fillPercent: totalCapacity > 0
            ? ((seatsSold / totalCapacity) * 100).toFixed(1) + '%'
            : '0%',
        };
      }),
    });
  } catch (err) { next(err); }
}

// ── Bonus: Revenue summary per event (filterable by date range) ───────────────
export async function revenueSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query;

    const qb = AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('event.id', 'eventId')
      .addSelect('event.title', 'title')
      .addSelect('event.city', 'city')
      .addSelect('SUM(booking.total_price)', 'totalRevenue')
      .addSelect('SUM(booking.quantity)', 'totalTickets')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'confirmed' })
      .groupBy('event.id')
      .orderBy('totalRevenue', 'DESC');

    if (from) qb.andWhere('event.start_date >= :from', { from });
    if (to)   qb.andWhere('event.start_date <= :to', { to });

    const results = await qb.getRawMany();

    res.json({
      query: 'Revenue summary per event',
      filters: { from, to },
      results: results.map(r => ({
        eventId: r.eventId,
        title: r.title,
        city: r.city,
        totalRevenue: Number(r.totalRevenue),
        totalTickets: Number(r.totalTickets),
      })),
    });
  } catch (err) { next(err); }
}

// ── Bonus: Attendance by city (filterable by month + year) ────────────────────
export async function attendanceByCity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { month, year } = req.query;

    const qb = AppDataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .select('event.city', 'city')
      .addSelect('SUM(booking.quantity)', 'totalAttendees')
      .addSelect('COUNT(DISTINCT event.id)', 'eventCount')
      .innerJoin('booking.event', 'event')
      .where('booking.status = :status', { status: 'confirmed' })
      .groupBy('event.city')
      .orderBy('totalAttendees', 'DESC');

    if (year) qb.andWhere("strftime('%Y', event.start_date) = :year", { year: String(year) });
    if (month) qb.andWhere("strftime('%m', event.start_date) = :month", { month: String(month).padStart(2, '0') });

    const results = await qb.getRawMany();

    res.json({
      query: 'Attendance summary per city',
      filters: { month, year },
      results: results.map(r => ({
        city: r.city,
        totalAttendees: Number(r.totalAttendees),
        eventCount: Number(r.eventCount),
      })),
    });
  } catch (err) { next(err); }
}
