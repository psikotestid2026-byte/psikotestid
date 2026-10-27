import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';

config({ path: '.env.local' });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL belum diisi. Seed kamus DISC tidak dijalankan.');
    process.exit(1);
  }

  const filePath = path.join(process.cwd(), 'drizzle/seeds/disc_dictionary.sql');
  const sqlText = readFileSync(filePath, 'utf8');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(sqlText);
    console.log('Kamus DISC diperbarui dari drizzle/seeds/disc_dictionary.sql');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
