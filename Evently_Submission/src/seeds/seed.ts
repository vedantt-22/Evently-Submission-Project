import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../entities/User';
import { Event } from '../entities/Event';
import { TicketTier } from '../entities/TicketTier';
import { Booking } from '../entities/Booking';
import bcrypt from 'bcryptjs';
import { AppDataSource, initializeDatabase } from '../datasource';

async function seed() {
  await initializeDatabase();
  const ds = AppDataSource;

  console.log('🌱 Seeding database...');

  // ── Users ─────────────────────────────────────────────────────────────────
  const userRepo = ds.getRepository(User);
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const users = await userRepo.save([
    { name: 'Alice Organiser', email: 'alice@evently.com', password: hash('password123') },
    { name: 'Bob Organiser', email: 'bob@evently.com', password: hash('password123') },
    { name: 'Carol Attendee', email: 'carol@evently.com', password: hash('password123') },
    { name: 'David Attendee', email: 'david@evently.com', password: hash('password123') },
    { name: 'Eva Attendee', email: 'eva@evently.com', password: hash('password123') },
    { name: 'Frank Attendee', email: 'frank@evently.com', password: hash('password123') },
    { name: 'Grace Attendee', email: 'grace@evently.com', password: hash('password123') },
  ]);

  const [alice, bob, carol, david, eva, frank, grace] = users;
  console.log(`   ✅ ${users.length} users created`);

  // ── Events ────────────────────────────────────────────────────────────────
  const eventRepo = ds.getRepository(Event);

  const events = await eventRepo.save([
    {
      title: 'Tech Summit 2025',
      description: 'The biggest tech conference of the year covering AI, cloud, and DevOps.',
      venueName: 'Grand Convention Center',
      city: 'Mumbai',
      startDate: new Date('2025-01-15T09:00:00'),
      endDate: new Date('2025-01-16T18:00:00'),
      status: 'published',
      organizerId: alice.id,
    },
    {
      title: 'Design Conf 2025',
      description: 'A premier conference for UX/UI designers and product thinkers.',
      venueName: 'Creative Hub',
      city: 'Bangalore',
      startDate: new Date('2025-02-20T10:00:00'),
      endDate: new Date('2025-02-20T17:00:00'),
      status: 'published',
      organizerId: alice.id,
    },
    {
      title: 'Startup Expo Q1',
      description: 'Meet the most promising startups of Q1 2025 and network with investors.',
      venueName: 'Expo Grounds',
      city: 'Delhi',
      startDate: new Date('2025-03-10T09:00:00'),
      endDate: new Date('2025-03-11T19:00:00'),
      status: 'published',
      organizerId: bob.id,
    },
    {
      title: 'CloudWorld 2025',
      description: 'Cloud infrastructure, Kubernetes, and platform engineering.',
      venueName: 'Tech Park Auditorium',
      city: 'Mumbai',
      startDate: new Date('2025-04-05T09:00:00'),
      endDate: new Date('2025-04-05T18:00:00'),
      status: 'published',
      organizerId: bob.id,
    },
    {
      title: 'AI & ML Summit',
      description: 'Cutting-edge research in Artificial Intelligence and Machine Learning.',
      venueName: 'Science Centre',
      city: 'Pune',
      startDate: new Date('2026-04-20T09:00:00'),  // upcoming — for Q13
      endDate: new Date('2026-04-20T18:00:00'),
      status: 'published',
      organizerId: alice.id,
    },
    {
      title: 'Future Finance Forum',
      description: 'Fintech, blockchain, and the future of banking.',
      venueName: 'Finance Tower',
      city: 'Mumbai',
      startDate: new Date('2026-04-10T09:00:00'),  // upcoming — for Q13
      endDate: new Date('2026-04-10T17:00:00'),
      status: 'published',
      organizerId: bob.id,
    },
    {
      // Q5 target — tiny capacity, nearly sold out → fewer than 10 seats remaining
      title: 'DevOps Meetup',
      description: 'A small hands-on DevOps workshop — nearly sold out!',
      venueName: 'Co-Work Lab',
      city: 'Pune',
      startDate: new Date('2025-03-25T18:00:00'),
      endDate: new Date('2025-03-25T21:00:00'),
      status: 'published',
      organizerId: bob.id,
    },
    {
      // Q10 target — published but will have ZERO bookings
      title: 'Green Energy Expo 2025',
      description: 'Sustainable energy solutions showcase — just announced!',
      venueName: 'Eco Centre',
      city: 'Chennai',
      startDate: new Date('2025-05-20T09:00:00'),
      endDate: new Date('2025-05-20T17:00:00'),
      status: 'published',
      organizerId: alice.id,
    },
    {
      title: 'Draft Workshop',
      description: 'An internal planning workshop — not yet published.',
      venueName: 'Office Room 4',
      city: 'Bangalore',
      startDate: new Date('2026-06-01T10:00:00'),
      endDate: new Date('2026-06-01T16:00:00'),
      status: 'draft',
      organizerId: alice.id,
    },
  ]);

  const [techSummit, designConf, startupExpo, cloudWorld, aiSummit, finForum, devOpsMeetup, greenExpo] = events;
  console.log(`   ✅ ${events.length} events created`);

  // ── Ticket Tiers ──────────────────────────────────────────────────────────
  const tierRepo = ds.getRepository(TicketTier);

  const tiers = await tierRepo.save([
    // Tech Summit 2025
    { name: 'General Admission', price: 999, totalCapacity: 300, availableSeats: 300, isAvailable: true, eventId: techSummit.id },
    { name: 'VIP', price: 2999, totalCapacity: 50, availableSeats: 50, isAvailable: true, eventId: techSummit.id },
    { name: 'Early Bird', price: 699, totalCapacity: 100, availableSeats: 100, isAvailable: true, eventId: techSummit.id },
    // Design Conf 2025
    { name: 'General Admission', price: 799, totalCapacity: 200, availableSeats: 200, isAvailable: true, eventId: designConf.id },
    { name: 'VIP', price: 1999, totalCapacity: 30, availableSeats: 30, isAvailable: true, eventId: designConf.id },
    // Startup Expo Q1
    { name: 'General Admission', price: 499, totalCapacity: 500, availableSeats: 500, isAvailable: true, eventId: startupExpo.id },
    { name: 'Investor Pass', price: 4999, totalCapacity: 20, availableSeats: 20, isAvailable: true, eventId: startupExpo.id },
    // CloudWorld
    { name: 'General Admission', price: 1299, totalCapacity: 150, availableSeats: 150, isAvailable: true, eventId: cloudWorld.id },
    { name: 'Early Bird', price: 899, totalCapacity: 80, availableSeats: 80, isAvailable: true, eventId: cloudWorld.id },
    // AI & ML Summit (upcoming)
    { name: 'General Admission', price: 1499, totalCapacity: 200, availableSeats: 200, isAvailable: true, eventId: aiSummit.id },
    { name: 'VIP', price: 3499, totalCapacity: 40, availableSeats: 40, isAvailable: true, eventId: aiSummit.id },
    // Future Finance Forum (upcoming)
    { name: 'General Admission', price: 1199, totalCapacity: 250, availableSeats: 250, isAvailable: true, eventId: finForum.id },
    { name: 'VIP', price: 2499, totalCapacity: 30, availableSeats: 30, isAvailable: true, eventId: finForum.id },
    // DevOps Meetup — tiny capacity (12 total seats → will drop to 2 after bookings → Q5 ✓)
    { name: 'General Admission', price: 299, totalCapacity: 12, availableSeats: 12, isAvailable: true, eventId: devOpsMeetup.id },
    // Green Energy Expo — has tiers but NO bookings will be created → Q10 ✓
    { name: 'General Admission', price: 599, totalCapacity: 200, availableSeats: 200, isAvailable: true, eventId: greenExpo.id },
    { name: 'VIP', price: 1499, totalCapacity: 30, availableSeats: 30, isAvailable: true, eventId: greenExpo.id },
  ]);

  // Map tiers by event + name for easy lookup
  const tierMap: Record<string, TicketTier> = {};
  for (const t of tiers) {
    tierMap[`${t.eventId}-${t.name}`] = t;
  }
  console.log(`   ✅ ${tiers.length} ticket tiers created`);

  // ── Bookings via transaction ───────────────────────────────────────────────
  const bookingRepo = ds.getRepository(Booking);

  interface BookingInput {
    userId: number; tierId: number; eventId: number;
    quantity: number; price: number;
    status?: 'confirmed' | 'cancelled';
    createdAt?: Date;
  }

  const bookingData: BookingInput[] = [
    // ── Tech Summit — Jan 2025 — heavy traffic ──────────────────────────────
    { userId: carol.id, tierId: tierMap[`${techSummit.id}-Early Bird`].id, eventId: techSummit.id, quantity: 2, price: 699, createdAt: new Date('2025-01-10') },
    { userId: david.id, tierId: tierMap[`${techSummit.id}-General Admission`].id, eventId: techSummit.id, quantity: 3, price: 999, createdAt: new Date('2025-01-11') },
    { userId: eva.id, tierId: tierMap[`${techSummit.id}-VIP`].id, eventId: techSummit.id, quantity: 1, price: 2999, createdAt: new Date('2025-01-12') },
    { userId: frank.id, tierId: tierMap[`${techSummit.id}-General Admission`].id, eventId: techSummit.id, quantity: 4, price: 999, createdAt: new Date('2025-01-13') },
    { userId: grace.id, tierId: tierMap[`${techSummit.id}-VIP`].id, eventId: techSummit.id, quantity: 2, price: 2999, createdAt: new Date('2025-01-13') },
    { userId: carol.id, tierId: tierMap[`${techSummit.id}-VIP`].id, eventId: techSummit.id, quantity: 1, price: 2999, createdAt: new Date('2025-01-14'), status: 'cancelled' },

    // ── Design Conf — Feb 2025 ──────────────────────────────────────────────
    { userId: carol.id, tierId: tierMap[`${designConf.id}-General Admission`].id, eventId: designConf.id, quantity: 2, price: 799, createdAt: new Date('2025-02-05') },
    { userId: david.id, tierId: tierMap[`${designConf.id}-VIP`].id, eventId: designConf.id, quantity: 1, price: 1999, createdAt: new Date('2025-02-10') },
    { userId: eva.id, tierId: tierMap[`${designConf.id}-General Admission`].id, eventId: designConf.id, quantity: 3, price: 799, createdAt: new Date('2025-02-15') },

    // ── Startup Expo — Mar 2025 ─────────────────────────────────────────────
    { userId: frank.id, tierId: tierMap[`${startupExpo.id}-General Admission`].id, eventId: startupExpo.id, quantity: 5, price: 499, createdAt: new Date('2025-03-01') },
    { userId: grace.id, tierId: tierMap[`${startupExpo.id}-Investor Pass`].id, eventId: startupExpo.id, quantity: 1, price: 4999, createdAt: new Date('2025-03-02') },
    { userId: carol.id, tierId: tierMap[`${startupExpo.id}-General Admission`].id, eventId: startupExpo.id, quantity: 2, price: 499, createdAt: new Date('2025-03-03') },
    { userId: david.id, tierId: tierMap[`${startupExpo.id}-General Admission`].id, eventId: startupExpo.id, quantity: 3, price: 499, createdAt: new Date('2025-03-04'), status: 'cancelled' },

    // ── CloudWorld — Apr 2025 ───────────────────────────────────────────────
    { userId: eva.id, tierId: tierMap[`${cloudWorld.id}-Early Bird`].id, eventId: cloudWorld.id, quantity: 2, price: 899, createdAt: new Date('2025-04-01') },
    { userId: frank.id, tierId: tierMap[`${cloudWorld.id}-General Admission`].id, eventId: cloudWorld.id, quantity: 1, price: 1299, createdAt: new Date('2025-04-02') },

    // ── Upcoming events — partial bookings for Q13 fill-rate ────────────────
    { userId: carol.id, tierId: tierMap[`${aiSummit.id}-General Admission`].id, eventId: aiSummit.id, quantity: 10, price: 1499, createdAt: new Date('2026-03-01') },
    { userId: david.id, tierId: tierMap[`${aiSummit.id}-VIP`].id, eventId: aiSummit.id, quantity: 5, price: 3499, createdAt: new Date('2026-03-02') },
    { userId: eva.id, tierId: tierMap[`${finForum.id}-General Admission`].id, eventId: finForum.id, quantity: 20, price: 1199, createdAt: new Date('2026-03-05') },

    // ── DevOps Meetup — sell 10 of 12 seats → only 2 remaining → Q5 ✓ ──────
    { userId: carol.id, tierId: tierMap[`${devOpsMeetup.id}-General Admission`].id, eventId: devOpsMeetup.id, quantity: 6, price: 299, createdAt: new Date('2025-03-20') },
    { userId: david.id, tierId: tierMap[`${devOpsMeetup.id}-General Admission`].id, eventId: devOpsMeetup.id, quantity: 4, price: 299, createdAt: new Date('2025-03-21') },

    // ── Green Energy Expo — intentionally ZERO bookings → Q10 ✓ ─────────────
    // (no entries here — this event stays empty on purpose)
  ];

  // Save bookings and update seat counts atomically
  for (const b of bookingData) {
    await ds.transaction(async (manager) => {
      const booking = manager.create(Booking, {
        userId: b.userId,
        tierId: b.tierId,
        eventId: b.eventId,
        quantity: b.quantity,
        totalPrice: b.price * b.quantity,
        status: b.status || 'confirmed',
        createdAt: b.createdAt,
      });
      await manager.save(Booking, booking);

      // Only deduct seats for confirmed bookings
      if ((b.status || 'confirmed') === 'confirmed') {
        await manager
          .createQueryBuilder()
          .update(TicketTier)
          .set({ availableSeats: () => `available_seats - ${b.quantity}` })
          .where('id = :id', { id: b.tierId })
          .execute();
      }
    });
  }

  console.log(`   ✅ ${bookingData.length} bookings created`);
  console.log('\n🎉 Seed complete! Test credentials:');
  console.log('   alice@evently.com / password123  (organiser — 4 events)');
  console.log('   bob@evently.com   / password123  (organiser — 3 events)');
  console.log('   carol@evently.com / password123  (attendee)');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});