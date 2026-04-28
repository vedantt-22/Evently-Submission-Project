import { Response, NextFunction } from 'express';
import { AppDataSource } from '../datasource';
import { Booking } from '../entities/Booking';
import { Event } from '../entities/Event';
import { TicketTier } from '../entities/TicketTier';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// POST /bookings — Create a booking (atomic transaction)
export async function createBooking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { eventId, tierId, quantity } = req.body;
    const userId = req.user!.id;

    const result = await AppDataSource.transaction(async (manager) => {
      // Lock the tier row for update
      const tier = await manager.findOne(TicketTier, { where: { id: tierId, eventId } });
      if (!tier) throw new AppError('Ticket tier not found', 404);
      if (!tier.isAvailable) throw new AppError('This ticket tier is not available', 400);

      // Check event is published and not cancelled
      const event = await manager.findOne(Event, { where: { id: eventId } });
      if (!event) throw new AppError('Event not found', 404);
      if (event.status === 'cancelled') throw new AppError('Cannot book tickets for a cancelled event', 400);
      if (event.status !== 'published') throw new AppError('Event is not published yet', 400);

      // Check seat availability
      if (tier.availableSeats < quantity) {
        throw new AppError(
          `Not enough seats. Requested: ${quantity}, Available: ${tier.availableSeats}`,
          400
        );
      }

      // Deduct seats
      tier.availableSeats -= quantity;
      await manager.save(TicketTier, tier);

      // Create booking record
      const booking = manager.create(Booking, {
        userId,
        eventId,
        tierId,
        quantity,
        totalPrice: Number(tier.price) * quantity,
        status: 'confirmed',
      });
      await manager.save(Booking, booking);

      return booking;
    });

    const booking = await AppDataSource.getRepository(Booking).findOne({
      where: { id: result.id },
      relations: ['event', 'tier', 'user'],
    });
    res.status(201).json(booking);
  } catch (err) { next(err); }
}

// GET /bookings — Get current user's bookings
export async function getUserBookings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const bookings = await AppDataSource.getRepository(Booking).find({
      where: { userId: req.user!.id },
      relations: ['event', 'tier'],
      order: { createdAt: 'DESC' },
    });
    res.json(bookings);
  } catch (err) { next(err); }
}

// DELETE /bookings/:id — Cancel a booking (atomic transaction)
export async function cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const bookingId = Number(req.params.id);
    const userId = req.user!.id;

    await AppDataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, { where: { id: bookingId, userId } });
      if (!booking) throw new AppError('Booking not found or not yours', 404);
      if (booking.status === 'cancelled') throw new AppError('Booking is already cancelled', 400);

      // Return seats to tier
      const tier = await manager.findOne(TicketTier, { where: { id: booking.tierId } });
      if (tier) {
        tier.availableSeats += booking.quantity;
        await manager.save(TicketTier, tier);
      }

      booking.status = 'cancelled';
      await manager.save(Booking, booking);
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
}
