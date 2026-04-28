import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id',         type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'name',       type: 'varchar', length: '100' },
        { name: 'email',      type: 'varchar', length: '150', isUnique: true },
        { name: 'password',   type: 'varchar' },
        { name: 'createdAt',  type: 'datetime', default: "datetime('now')" },
        { name: 'updatedAt',  type: 'datetime', default: "datetime('now')" },
      ],
    }), true);

    // Events table
    await queryRunner.createTable(new Table({
      name: 'events',
      columns: [
        { name: 'id',           type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'title',        type: 'varchar', length: '200' },
        { name: 'description',  type: 'text' },
        { name: 'venue_name',   type: 'varchar', length: '200' },
        { name: 'city',         type: 'varchar', length: '100' },
        { name: 'start_date',   type: 'datetime' },
        { name: 'end_date',     type: 'datetime' },
        { name: 'status',       type: 'varchar', length: '20', default: "'draft'" },
        { name: 'organizer_id', type: 'integer' },
        { name: 'createdAt',    type: 'datetime', default: "datetime('now')" },
        { name: 'updatedAt',    type: 'datetime', default: "datetime('now')" },
      ],
    }), true);

    await queryRunner.createForeignKey('events', new TableForeignKey({
      columnNames: ['organizer_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Ticket tiers table
    await queryRunner.createTable(new Table({
      name: 'ticket_tiers',
      columns: [
        { name: 'id',               type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'name',             type: 'varchar', length: '100' },
        { name: 'price',            type: 'decimal', precision: 10, scale: 2 },
        { name: 'total_capacity',   type: 'integer' },
        { name: 'available_seats',  type: 'integer' },
        { name: 'is_available',     type: 'boolean', default: 1 },
        { name: 'event_id',         type: 'integer' },
        { name: 'createdAt',        type: 'datetime', default: "datetime('now')" },
        { name: 'updatedAt',        type: 'datetime', default: "datetime('now')" },
      ],
    }), true);

    await queryRunner.createForeignKey('ticket_tiers', new TableForeignKey({
      columnNames: ['event_id'],
      referencedTableName: 'events',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Bookings table
    await queryRunner.createTable(new Table({
      name: 'bookings',
      columns: [
        { name: 'id',          type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'user_id',     type: 'integer' },
        { name: 'event_id',    type: 'integer' },
        { name: 'tier_id',     type: 'integer' },
        { name: 'quantity',    type: 'integer' },
        { name: 'total_price', type: 'decimal', precision: 10, scale: 2 },
        { name: 'status',      type: 'varchar', length: '20', default: "'confirmed'" },
        { name: 'createdAt',   type: 'datetime', default: "datetime('now')" },
        { name: 'updatedAt',   type: 'datetime', default: "datetime('now')" },
      ],
    }), true);

    await queryRunner.createForeignKey('bookings', new TableForeignKey({
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('bookings', new TableForeignKey({
      columnNames: ['event_id'],
      referencedTableName: 'events',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('bookings', new TableForeignKey({
      columnNames: ['tier_id'],
      referencedTableName: 'ticket_tiers',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bookings', true);
    await queryRunner.dropTable('ticket_tiers', true);
    await queryRunner.dropTable('events', true);
    await queryRunner.dropTable('users', true);
  }
}
