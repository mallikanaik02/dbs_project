// database/setup.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🔄 Initializing database...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('🔌 Connected to MySQL server.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Executing schema.sql...');
    await conn.query(schemaSql);
    console.log('✅ Schema created successfully.');

    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('🌱 Executing seed.sql...');
    await conn.query(seedSql);
    console.log('✅ Seed data inserted successfully.');

    const [tables] = await conn.query('SHOW TABLES IN shelf_and_co;');
    console.log('📋 Tables in shelf_and_co:', tables.map(t => Object.values(t)[0]).join(', '));

    console.log('\n🎉 Database setup complete!');
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setupDatabase();
