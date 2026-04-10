import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  const connectionString = 'postgresql://postgres.xidejqlynvnziotdhbwc:KYFREuLtLMQG6xhD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB successfully!');
    const res = await client.query('SELECT 1 as val');
    console.log(res.rows);
  } catch (err) {
    console.error('Connection Error Output:', err);
  } finally {
    await client.end();
  }
}

testConnection();
