import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('service_metadata', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    environment_id: {
      type: 'uuid',
      notNull: true,
      references: 'environments(id)',
      onDelete: 'CASCADE'
    },
    service_name: {
      type: 'varchar(255)',
      notNull: true
    },
    service_type: {
      type: 'varchar(50)',
      notNull: true
    },
    image: {
      type: 'varchar(255)'
    },
    ports: {
      type: 'jsonb'
    },
    networks: {
      type: 'jsonb'
    },
    volumes: {
      type: 'jsonb'
    },
    depends_on: {
      type: 'jsonb'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'unknown'
    },
    container_id: {
      type: 'varchar(255)'
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

  pgm.createIndex('service_metadata', 'environment_id');
  pgm.createIndex('service_metadata', ['environment_id', 'service_name'], { unique: true });
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable('service_metadata');
}
