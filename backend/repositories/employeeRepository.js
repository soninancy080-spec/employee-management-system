const prisma = require('../db');

class EmployeeRepository {
  async findById(id) {
    return await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        department: true,
        skills: true,
        manager: true,
        allocations: {
          include: { asset: true }
        },
        user: {
          select: { role: true },
        },
      },
    });
  }

  async findByUserId(userId) {
    return await prisma.employee.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        department: true,
        skills: true,
        manager: true,
        allocations: {
          include: { asset: true }
        },
        user: {
          select: { role: true },
        },
      },
    });
  }

  async findByEmail(email) {
    return await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(data) {
    return await prisma.employee.create({
      data,
      include: {
        department: true,
        skills: true,
      },
    });
  }

  async update(id, data) {
    return await prisma.employee.update({
      where: { id: parseInt(id) },
      data,
      include: {
        department: true,
        skills: true,
      },
    });
  }

  async delete(id) {
    return await prisma.employee.delete({
      where: { id: parseInt(id) },
    });
  }

  async findAll(filters) {
    const { search, departmentId, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = filters;
    const skip = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (departmentId) {
      conditions.push(`department_id = $${paramIndex}`);
      params.push(parseInt(departmentId));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortBy = ['name', 'email', 'phone', 'department_name', 'manager_name', 'role', 'created_at'];
    const finalSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'name';
    const finalSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';

    const countQuery = `SELECT COUNT(*)::int AS count FROM employee_details_view ${whereClause}`;
    const selectQuery = `SELECT * FROM employee_details_view ${whereClause} ORDER BY ${finalSortBy} ${finalSortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const total = countResult[0]?.count || 0;

    const selectParams = [...params, limit, skip];
    const employees = await prisma.$queryRawUnsafe(selectQuery, ...selectParams);

    // Map raw SQL snake_case columns to camelCase expected by the frontend
    const employeeIds = employees.map(e => e.id);
    const employeeSkills = employeeIds.length > 0 ? await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        skills: true,
      }
    }) : [];

    const skillsMap = {};
    employeeSkills.forEach(es => {
      skillsMap[es.id] = es.skills;
    });

    const employeesMapped = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      profileImage: emp.profile_image,
      resumePath: emp.resume_path,
      documents: emp.documents,
      departmentId: emp.department_id,
      department: emp.department_id ? { id: emp.department_id, name: emp.department_name } : null,
      managerId: emp.manager_id,
      managerName: emp.manager_name,
      userId: emp.user_id,
      role: emp.role,
      trackingMode: emp.tracking_mode,
      grossSalary: emp.gross_salary,
      createdAt: emp.created_at,
      skills: skillsMap[emp.id] || [],
    }));

    return { employees: employeesMapped, total };
  }
}

module.exports = new EmployeeRepository();
