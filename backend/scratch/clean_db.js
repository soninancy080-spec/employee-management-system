const prisma = require('../db');

async function cleanDb() {
  const tableNames = [
    'users',
    'employees',
    'departments',
    'skills',
    'leave_requests',
    'leave_balances',
    'leave_histories',
    'assets',
    'asset_allocations',
    'notifications',
    'audit_logs',
    'attendance_records'
  ];

  console.log('Cleaning all tables in the database...');
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      console.log(`Table "${tableName}" truncated successfully.`);
    } catch (err) {
      console.error(`Error truncating table "${tableName}":`, err.message);
    }
  }
}

cleanDb()
  .then(() => {
    console.log('Database clean-up completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database clean-up failed:', err);
    process.exit(1);
  });
