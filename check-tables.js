const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Ritik%40517%40%23@db.fcmmcgyqovqbxbqfeaho.supabase.co:5432/postgres'
  });
  
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log(res.rows);
  await client.end();
}
run();
