import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  const client = new Client({
    host: '2406:da1a:6b0:f601:6e06:2b77:9622:34e5',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'KYFREuLtLMQG6xhD'
  });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query('SELECT 1 as val');
    console.log(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
