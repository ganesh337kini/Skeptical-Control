import pool from '../config/database';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  upload_path: string;
  file_size: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  user_id: string;
  name: string;
  description?: string;
  upload_path: string;
  file_size: number;
}

export class ProjectModel {
  static async create(input: CreateProjectInput): Promise<Project> {
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, upload_path, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.user_id, input.name, input.description || null, input.upload_path, input.file_size]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Project | null> {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(user_id: string): Promise<Project[]> {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  static async updateStatus(id: string, status: string): Promise<Project> {
    const result = await pool.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }

  static async countByUserId(user_id: string): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [user_id]
    );
    return parseInt(result.rows[0].count);
  }
}
