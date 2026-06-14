const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const prisma = require('./db');
const { errorHandler } = require('./middleware/errorHandler');
const { initCronJobs } = require('./jobs/cronJobs');
require('dotenv').config();

const app = express();

// Ensure uploads directory exists on startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Database initialization hook for views and stored procedures
async function initDb() {
  try {
    const sqlPath = path.join(__dirname, 'prisma', 'db_init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const statements = sql.split('--;;');
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          await prisma.$executeRawUnsafe(trimmed);
        }
      }
      console.log('Database structures (views & functions) verified and initialized.');
    } else {
      console.warn('db_init.sql not found in prisma folder.');
    }

    // Auto-seed default departments if empty
    const deptCount = await prisma.department.count();
    if (deptCount === 0) {
      const defaultDepts = [
        { name: 'Engineering', description: 'Software engineering and product development' },
        { name: 'Human Resources', description: 'Talent acquisition, operations, and culture' },
        { name: 'Marketing', description: 'Growth, branding, and user acquisition' },
        { name: 'Finance', description: 'Accounting, payroll, and financial planning' },
        { name: 'Sales', description: 'Business development and customer success' }
      ];
      for (const dept of defaultDepts) {
        await prisma.department.create({ data: dept });
      }
      console.log('Seeded default departments.');
    }

    // Auto-seed default skills if empty
    const skillCount = await prisma.skill.count();
    if (skillCount === 0) {
      const defaultSkills = [
        'React', 'Node.js', 'Prisma', 'PostgreSQL', 'JavaScript', 
        'TypeScript', 'Python', 'CSS', 'Project Management', 
        'Communication', 'Technical Support'
      ];
      for (const skillName of defaultSkills) {
        await prisma.skill.create({ data: { name: skillName } });
      }
      console.log('Seeded default skills.');
    }
  } catch (err) {
    console.error('Error executing database initialization:', err);
  }
}

initDb();
initCronJobs();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// Swagger Documentation API Docs Page
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1/health', require('./routes/health'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/departments', require('./routes/departments'));
app.use('/api/v1/skills', require('./routes/skills'));
app.use('/api/v1/employees', require('./routes/employees'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/leaves', require('./routes/leaves'));
app.use('/api/v1/audit', require('./routes/audit'));
app.use('/api/v1/assets', require('./routes/assets'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/salaries', require('./routes/salaries'));
app.use('/api/v1/evaluations', require('./routes/evaluations'));

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'EMS Enterprise API is running...' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
