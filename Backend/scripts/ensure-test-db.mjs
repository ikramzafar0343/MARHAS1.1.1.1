import pg from 'pg';

const client = new pg.Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  connectionTimeoutMillis: 5000
});

try {
  await client.connect();
  console.log('connected as', (await client.query('SELECT current_user')).rows[0]);
  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'marhas_test'"
  );
  if (!exists.rows.length) {
    await client.query('CREATE DATABASE marhas_test');
    console.log('created marhas_test');
  } else {
    console.log('marhas_test exists');
  }
  await client.end();
  process.exit(0);
} catch (error) {
  console.error('ERR', error.message);
  process.exit(1);
}
