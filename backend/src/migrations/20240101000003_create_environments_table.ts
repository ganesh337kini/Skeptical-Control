import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('environments', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects(id)',
      onDelete: 'CASCADE'
    },
    project_version_id: {
      type: 'uuid',
      references: 'project_versions(id)',
      onDelete: 'SET NULL'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'stopped'
    },
    workspace_path: {
      type: 'varchar(255)'
    },
    docker_compose_project: {
      type: 'varchar(255)'
    },
    container_ids: {
      type: 'jsonb'
    },
    resource_limits: {
      type: 'jsonb'
    },
    started_at: {
      type: 'timestamp'
    },
    stopped_at: {
      type: 'timestamp'
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

  pgm.createIndex('environments', 'project_id');
  pgm.createIndex('environments', 'status');
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('environments');
}
