process.env.JWT_SECRET = 'test-secret';
process.env.POSTGRES_DB = 'skeptical_control_test';
process.env.POSTGRES_USER = 'skeptical';
process.env.POSTGRES_PASSWORD = 'skeptical_dev';

jest.mock('pg', () => {
  const users = new Map<string, any>();
  let sequence = 1;

  class Pool {
    on() {}

    async query(text: string, values: any[] = []) {
      const sql = text.replace(/\s+/g, ' ').trim();

      if (sql.startsWith('INSERT INTO users')) {
        const [email, password_hash, name] = values;
        const user = {
          id: `test-user-${sequence++}`,
          email,
          password_hash,
          name,
          created_at: new Date(),
          updated_at: new Date(),
        };
        users.set(email, user);
        return { rows: [user] };
      }

      if (sql.startsWith('SELECT * FROM users WHERE email = $1')) {
        return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
      }

      if (sql.startsWith('SELECT * FROM users WHERE id = $1')) {
        const found = Array.from(users.values()).find((user: any) => user.id === values[0]);
        return { rows: found ? [found] : [] };
      }

      if (sql.startsWith('UPDATE users SET updated_at = NOW() WHERE id = $1')) {
        const found = Array.from(users.values()).find((user: any) => user.id === values[0]);
        if (found) found.updated_at = new Date();
        return { rows: found ? [found] : [] };
      }

      throw new Error(`Unsupported test database query: ${sql}`);
    }
  }

  return { Pool };
});
