const employeeRepository = require('../repositories/employeeRepository');
const auditService = require('./auditService');
const { AppError } = require('../middleware/errorHandler');

class EmployeeService {
  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return employee;
  }

  async getEmployeeByUserId(userId) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }
    return employee;
  }

  async updateMyProfile(userId, data, performedById) {
    const employee = await employeeRepository.findByUserId(userId);
    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const oldValues = {
      name: employee.name,
      phone: employee.phone,
      profileImage: employee.profileImage,
      resumePath: employee.resumePath,
      documents: employee.documents,
    };

    const updatedEmployee = await employeeRepository.update(employee.id, data);

    const newValues = {
      name: updatedEmployee.name,
      phone: updatedEmployee.phone,
      profileImage: updatedEmployee.profileImage,
      resumePath: updatedEmployee.resumePath,
      documents: updatedEmployee.documents,
    };

    await auditService.log(
      'EMPLOYEE_UPDATE_SELF',
      'Employee',
      employee.id,
      performedById,
      oldValues,
      newValues,
    );

    return updatedEmployee;
  }

  async createEmployee(data, performedById) {
    const existing = await employeeRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError(`Employee with email ${data.email} already exists.`, 400);
    }

    const employee = await employeeRepository.create(data);
    await auditService.log(
      'EMPLOYEE_CREATE',
      'Employee',
      employee.id,
      performedById,
      null,
      employee,
    );
    return employee;
  }

  async updateEmployee(id, data, performedById) {
    const oldEmployee = await employeeRepository.findById(id);
    if (!oldEmployee) {
      throw new AppError('Employee not found.', 404);
    }

    const oldValues = {
      name: oldEmployee.name,
      email: oldEmployee.email,
      phone: oldEmployee.phone,
      departmentId: oldEmployee.departmentId,
      profileImage: oldEmployee.profileImage,
      resumePath: oldEmployee.resumePath,
      documents: oldEmployee.documents,
    };

    const updatedEmployee = await employeeRepository.update(id, data);

    const newValues = {
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      departmentId: updatedEmployee.departmentId,
      profileImage: updatedEmployee.profileImage,
      resumePath: updatedEmployee.resumePath,
      documents: updatedEmployee.documents,
    };

    await auditService.log(
      'EMPLOYEE_UPDATE',
      'Employee',
      id,
      performedById,
      oldValues,
      newValues,
    );

    return updatedEmployee;
  }

  async deleteEmployee(id, performedById) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found.', 404);
    }

    await employeeRepository.delete(id);
    await auditService.log(
      'EMPLOYEE_DELETE',
      'Employee',
      id,
      performedById,
      employee,
      null,
    );
  }

  async listEmployees(filters) {
    return await employeeRepository.findAll(filters);
  }
}

module.exports = new EmployeeService();
