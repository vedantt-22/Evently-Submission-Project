import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { User } from './User';
import { TicketTier } from './TicketTier';
import { Booking } from './Booking';

export type EventStatus = 'draft' | 'published' | 'cancelled';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 200, name: 'venue_name' })
  venueName: string;

  @Column({ length: 100 })
  city: string;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft'
  })
  status: EventStatus;

  @Column({ name: 'organizer_id' })
  organizerId: number;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @OneToMany(() => TicketTier, (tier) => tier.event, { cascade: true })
  tiers: TicketTier[];

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
