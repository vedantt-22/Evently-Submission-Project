import { Response, NextFunction } from 'express';
import { AppDataSource } from '../datasource';
import { Event } from '../entities/Event';
import { TicketTier } from '../entities/TicketTier';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const eventRepo = () => AppDataSource.getRepository(Event);
const tierRepo = () => AppDataSource.getRepository(TicketTier);

// GET /events — list all published events
export async function listEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { city, status } = req.query;
    const qb = eventRepo()
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.tiers', 'tiers')
      .orderBy('event.startDate', 'ASC');

    if (city) qb.andWhere('event.city = :city', { city });
    if (status) qb.andWhere('event.status = :status', { status });

    const events = await qb.getMany();
    res.json(events);
  } catch (err) { next(err); }
}

// GET /events/:id
export async function getEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({
      where: { id: Number(req.params.id) },
      relations: ['organizer', 'tiers'],
    });
    if (!event) throw new AppError('Event not found', 404);
    res.json(event);
  } catch (err) { next(err); }
}

// POST /events
export async function createEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, venueName, city, startDate, endDate, status } = req.body;
    const event = eventRepo().create({
      title, description, venueName, city,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'draft',
      organizerId: req.user!.id,
    });
    await eventRepo().save(event);
    res.status(201).json(event);
  } catch (err) { next(err); }
}

// PUT /events/:id
export async function updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({ where: { id: Number(req.params.id) } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.organizerId !== req.user!.id) throw new AppError('Forbidden: not the organizer', 403);
    if (event.status === 'cancelled') throw new AppError('Cannot update a cancelled event', 400);

    const { title, description, venueName, city, startDate, endDate, status } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (venueName) event.venueName = venueName;
    if (city) event.city = city;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (status) {
      // If cancelling, mark all tiers unavailable
      if (status === 'cancelled') {
        await tierRepo().createQueryBuilder()
          .update(TicketTier)
          .set({ isAvailable: false })
          .where('event_id = :eventId', { eventId: event.id })
          .execute();
      }
      event.status = status;
    }
    await eventRepo().save(event);
    res.json(event);
  } catch (err) { next(err); }
}

// DELETE /events/:id  — soft cancel
export async function cancelEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({ where: { id: Number(req.params.id) } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.organizerId !== req.user!.id) throw new AppError('Forbidden: not the organizer', 403);
    if (event.status === 'cancelled') throw new AppError('Event is already cancelled', 400);

    event.status = 'cancelled';
    await eventRepo().save(event);

    // Mark all tiers unavailable
    await tierRepo().createQueryBuilder()
      .update(TicketTier)
      .set({ isAvailable: false })
      .where('event_id = :eventId', { eventId: event.id })
      .execute();

    res.json({ message: 'Event cancelled successfully', event });
  } catch (err) { next(err); }
}

// ── Ticket Tiers ───────────────────────────────────────────────────────────────

// POST /events/:id/tiers
export async function addTier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({ where: { id: Number(req.params.id) } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.organizerId !== req.user!.id) throw new AppError('Forbidden: not the organizer', 403);

    const { name, price, totalCapacity } = req.body;
    const tier = tierRepo().create({
      name, price, totalCapacity,
      availableSeats: totalCapacity,
      isAvailable: true,
      eventId: event.id,
    });
    await tierRepo().save(tier);
    res.status(201).json(tier);
  } catch (err) { next(err); }
}

// PUT /events/:id/tiers/:tierId
export async function updateTier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({ where: { id: Number(req.params.id) } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.organizerId !== req.user!.id) throw new AppError('Forbidden: not the organizer', 403);

    const tier = await tierRepo().findOne({ where: { id: Number(req.params.tierId), eventId: event.id } });
    if (!tier) throw new AppError('Ticket tier not found', 404);

    // Check if any tickets sold for this tier
    const soldCount = tier.totalCapacity - tier.availableSeats;
    if (soldCount > 0) throw new AppError('Cannot edit tier after tickets have been sold', 400);

    const { name, price, totalCapacity } = req.body;
    if (name) tier.name = name;
    if (price !== undefined) tier.price = price;
    if (totalCapacity !== undefined) {
      tier.totalCapacity = totalCapacity;
      tier.availableSeats = totalCapacity;
    }
    await tierRepo().save(tier);
    res.json(tier);
  } catch (err) { next(err); }
}

// DELETE /events/:id/tiers/:tierId
export async function removeTier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const event = await eventRepo().findOne({ where: { id: Number(req.params.id) } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.organizerId !== req.user!.id) throw new AppError('Forbidden: not the organizer', 403);

    const tier = await tierRepo().findOne({ where: { id: Number(req.params.tierId), eventId: event.id } });
    if (!tier) throw new AppError('Ticket tier not found', 404);

    const soldCount = tier.totalCapacity - tier.availableSeats;
    if (soldCount > 0) throw new AppError('Cannot remove tier after tickets have been sold', 400);

    await tierRepo().remove(tier);
    res.json({ message: 'Tier removed successfully' });
  } catch (err) { next(err); }
}
