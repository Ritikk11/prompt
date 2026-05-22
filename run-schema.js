const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = 'postgresql://postgres:Ritik%40517%40%23@db.fcmmcgyqovqbxbqfeaho.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres!');
    const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully executed schema!');
  } catch (err) {
    console.error('Connection/Execution error:', err.message);
  } finally {
    await client.end();
  }
}

run();
