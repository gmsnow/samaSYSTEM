import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres.tmomuyehffkukobpujcq:SNOW771034606@aws-0-eu-central-1.pooler.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1',
  connectionTimeoutMillis: 15000,
});
try {
  const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'");
  console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));
  const users = await pool.query('SELECT id, username, role FROM "users" LIMIT 5');
  console.log('Users:', JSON.stringify(users.rows, null, 2));
  await pool.end();
} catch (e) {
  console.log('ERROR:', e.message);
  await pool.end();
}
