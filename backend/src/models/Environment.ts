import pool from '../config/database';

export interface Environment {
  id: string;
  project_id: string;
  project_version_id: string | null;
  status: string;
  workspace_path: string | null;
  docker_compose_project: string | null;
  container_ids: Record<string, string> | null;
  resource_limits: Record<string, any> | null;
  started_at: Date | null;
  stopped_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEnvironmentInput {
  project_id: string;
  project_version_id?: string;
  workspace_path?: string;
  docker_compose_project?: string;
  resource_limits?: Record<string, any>;
}

export class EnvironmentModel {
  static async create(input: CreateEnvironmentInput): Promise<Environment> {
    const result = await pool.query(
      `INSERT INTO environments (project_id, project_version_id, workspace_path, docker_compose_project, resource_limits)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.project_id,
        input.project_version_id || null,
        input.workspace_path || null,
        input.docker_compose_project || null,
        input.resource_limits || null
      ]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Environment | null> {
    const result = await pool.query(
      'SELECT * FROM environments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByProjectId(project_id: string): Promise<Environment[]> {
    const result = await pool.query(
      'SELECT * FROM environments WHERE project_id = $1 ORDER BY created_at DESC',
      [project_id]
    );
    return result.rows;
  }

  static async updateStatus(id: string, status: string): Promise<Environment> {
    const result = await pool.query(
      'UPDATE environments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async updateContainerIds(id: string, container_ids: Record<string, string>): Promise<Environment> {
    const result = await pool.query(
      'UPDATE environments SET container_ids = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(container_ids), id]
    );
    return result.rows[0];
  }

  static async start(id: string): Promise<Environment> {
    const result = await pool.query(
      'UPDATE environments SET status = $1, started_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *',
      ['running', id]
    );
    return result.rows[0];
  }

  static async stop(id: string): Promise<Environment> {
    const result = await pool.query(
      'UPDATE environments SET status = $1, stopped_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *',
      ['stopped', id]
    );
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM environments WHERE id = $1', [id]);
  }

  static async countRunning(): Promise<number> {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM environments WHERE status = 'running'"
    );
    return parseInt(result.rows[0].count);
  }
}
