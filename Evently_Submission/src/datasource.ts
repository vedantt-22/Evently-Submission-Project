import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './entities/User';
import { Event } from './entities/Event';
import { TicketTier } from './entities/TicketTier';
import { Booking } from './entities/Booking';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve('./evently.db');

function loadDatabase(): Buffer | undefined {
  if (fs.existsSync(dbPath)) {
    return fs.readFileSync(dbPath);
  }
  return undefined;
}

export const AppDataSource = new DataSource({
  type: 'sqljs',
  autoSave: true,
  location: dbPath,
  database: loadDatabase(),
  synchronize: false,
  logging: false,
  entities: [User, Event, TicketTier, Booking],
  migrations: [InitialSchema1700000000000],
  subscribers: [],
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('✅ Database initialized and migrations applied');
  }
  return AppDataSource;
}
