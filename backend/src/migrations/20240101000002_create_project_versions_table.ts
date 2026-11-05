import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('project_versions', {
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
    version_number: {
      type: 'integer',
      notNull: true
    },
    inspection_data: {
      type: 'jsonb'
    },
    docker_compose_content: {
      type: 'text'
    },
    detected_services: {
      type: 'jsonb'
    },
    dependencies: {
      type: 'jsonb'
    },
    is_valid: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    validation_errors: {
      type: 'jsonb'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  pgm.createIndex('project_versions', 'project_id');
  pgm.createIndex('project_versions', ['project_id', 'version_number'], { unique: true });
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('project_versions');
}
