import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'uploaded'
    },
    upload_path: {
      type: 'varchar(255)',
      notNull: true
    },
    file_size: {
      type: 'bigint',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('projects', 'user_id');
  pgm.createIndex('projects', 'status');
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('projects');
}
