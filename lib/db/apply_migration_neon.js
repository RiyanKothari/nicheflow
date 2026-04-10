import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neonConfig, Client } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, 'drizzle/0000_neat_luckman.sql'), 'utf8');

  // The client will use WebSockets over port 443 behind the scenes
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to DB over WebSocket');
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
