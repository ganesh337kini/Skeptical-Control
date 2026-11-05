import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('activity_history', {
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
    project_id: {
      type: 'uuid',
      references: 'projects(id)',
      onDelete: 'SET NULL'
    },
    environment_id: {
      type: 'uuid',
      references: 'environments(id)',
      onDelete: 'SET NULL'
    },
    action_type: {
      type: 'varchar(100)',
      notNull: true
    },
    action_details: {
      type: 'jsonb'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'completed'
    },
    error_message: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('activity_history', 'user_id');
  pgm.createIndex('activity_history', 'project_id');
  pgm.createIndex('activity_history', 'created_at');
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('activity_history');
}
