const prisma = require('../db');

async function listUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Registered Users:');
    console.log(users);
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
