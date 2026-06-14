const employeeService = require('../services/employeeService');
const path = require('path');
const fs = require('fs');

const deleteFile = (relativePath) => {
  if (!relativePath) return;
  try {
    const fullPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error(`Error deleting file ${relativePath}:`, err.message);
  }
};

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const { search, departmentId, page, limit, sortBy, sortOrder } = req.query;

      const result = await employeeService.listEmployees({
        search,
        departmentId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy: sortBy || 'name',
        sortOrder: sortOrder || 'asc',
      });

      res.json({
        success: true,
        data: result.employees,
        total: result.total,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEmployeeById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req, res, next) {
    const { 
      name, email, phone, departmentId, skills, managerId, userId, trackingMode,
      nationality, gender, age, hireType,
      educationLevel, degree, hardSkill, softSkill,
      address, postalCode, taxNumber
    } = req.body;

    if (!name || !email) {
      if (req.files) {
        if (req.files['profileImage']) deleteFile(`/uploads/${req.files['profileImage'][0].filename}`);
        if (req.files['resume']) deleteFile(`/uploads/${req.files['resume'][0].filename}`);
        if (req.files['documents']) req.files['documents'].forEach(f => deleteFile(`/uploads/${f.filename}`));
      }
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    try {
      let profileImageUrl = null;
      let resumeUrl = null;
      const docsUrls = [];

      if (req.files) {
        if (req.files['profileImage']) {
          profileImageUrl = `/uploads/${req.files['profileImage'][0].filename}`;
        }
        if (req.files['resume']) {
          resumeUrl = `/uploads/${req.files['resume'][0].filename}`;
        }
        if (req.files['documents']) {
          req.files['documents'].forEach((file) => {
            docsUrls.push(`/uploads/${file.filename}`);
          });
        }
      }

      let parsedSkills = [];
      if (skills) {
        parsedSkills = JSON.parse(skills).map(id => ({ id: parseInt(id) }));
      }

      const createData = {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        profileImage: profileImageUrl,
        resumePath: resumeUrl,
        documents: docsUrls,
        department: departmentId ? { connect: { id: parseInt(departmentId) } } : undefined,
        skills: { connect: parsedSkills },
        manager: managerId ? { connect: { id: parseInt(managerId) } } : undefined,
        user: userId ? { connect: { id: parseInt(userId) } } : undefined,
        trackingMode: trackingMode || 'OFFLINE',
        nationality: nationality || null,
        gender: gender || null,
        age: age ? parseInt(age) : null,
        hireType: hireType || 'Full Time',
        educationLevel: educationLevel || null,
        degree: degree || null,
        hardSkill: hardSkill || null,
        softSkill: softSkill || null,
        address: address || null,
        postalCode: postalCode || null,
        taxNumber: taxNumber || null,
      };

      const employee = await employeeService.createEmployee(createData, req.user.id);
      res.status(201).json({ success: true, data: employee });
    } catch (err) {
      if (req.files) {
        if (req.files['profileImage']) deleteFile(`/uploads/${req.files['profileImage'][0].filename}`);
        if (req.files['resume']) deleteFile(`/uploads/${req.files['resume'][0].filename}`);
        if (req.files['documents']) req.files['documents'].forEach(f => deleteFile(`/uploads/${f.filename}`));
      }
      next(err);
    }
  }

  async updateEmployee(req, res, next) {
    const id = parseInt(req.params.id);
    const { 
      name, email, phone, departmentId, skills, managerId, trackingMode,
      nationality, gender, age, hireType,
      educationLevel, degree, hardSkill, softSkill,
      address, postalCode, taxNumber, role, grossSalary
    } = req.body;

    try {
      const existingEmployee = await employeeService.getEmployeeById(id);

      const updateData = {
        name: name || existingEmployee.name,
        email: email ? email.toLowerCase() : existingEmployee.email,
        phone: phone !== undefined ? phone : existingEmployee.phone,
        trackingMode: trackingMode !== undefined ? trackingMode : existingEmployee.trackingMode,
        nationality: nationality !== undefined ? nationality : existingEmployee.nationality,
        gender: gender !== undefined ? gender : existingEmployee.gender,
        age: age !== undefined ? (age ? parseInt(age) : null) : existingEmployee.age,
        hireType: hireType !== undefined ? hireType : existingEmployee.hireType,
        educationLevel: educationLevel !== undefined ? educationLevel : existingEmployee.educationLevel,
        degree: degree !== undefined ? degree : existingEmployee.degree,
        hardSkill: hardSkill !== undefined ? hardSkill : existingEmployee.hardSkill,
        softSkill: softSkill !== undefined ? softSkill : existingEmployee.softSkill,
        address: address !== undefined ? address : existingEmployee.address,
        postalCode: postalCode !== undefined ? postalCode : existingEmployee.postalCode,
        taxNumber: taxNumber !== undefined ? taxNumber : existingEmployee.taxNumber,
        grossSalary: grossSalary !== undefined ? (grossSalary ? parseFloat(grossSalary) : 0) : existingEmployee.grossSalary,
      };

      if (departmentId !== undefined) {
        if (departmentId === "" || departmentId === "null" || departmentId === null) {
          updateData.department = { disconnect: true };
        } else {
          updateData.department = { connect: { id: parseInt(departmentId) } };
        }
      }

      if (managerId !== undefined) {
        if (managerId === "" || managerId === "null" || managerId === null) {
          updateData.manager = { disconnect: true };
        } else {
          updateData.manager = { connect: { id: parseInt(managerId) } };
        }
      }

      if (req.files) {
        if (req.files['profileImage']) {
          deleteFile(existingEmployee.profileImage);
          updateData.profileImage = `/uploads/${req.files['profileImage'][0].filename}`;
        }
        if (req.files['resume']) {
          deleteFile(existingEmployee.resumePath);
          updateData.resumePath = `/uploads/${req.files['resume'][0].filename}`;
        }
        if (req.files['documents']) {
          const newDocs = req.files['documents'].map(file => `/uploads/${file.filename}`);
          updateData.documents = [...(existingEmployee.documents || []), ...newDocs];
        }
      }

      if (skills) {
        const parsedSkills = JSON.parse(skills).map(id => ({ id: parseInt(id) }));
        updateData.skills = {
          set: [],
          connect: parsedSkills,
        };
      }

      // Update the user role if the employee is linked to a user profile
      if (role !== undefined && existingEmployee.userId) {
        const prismaInstance = require('../db');
        await prismaInstance.user.update({
          where: { id: existingEmployee.userId },
          data: { role: role }
        });
      }

      const updated = await employeeService.updateEmployee(id, updateData, req.user.id);
      res.json({ success: true, data: updated });
    } catch (err) {
      if (req.files) {
        if (req.files['profileImage']) deleteFile(`/uploads/${req.files['profileImage'][0].filename}`);
        if (req.files['resume']) deleteFile(`/uploads/${req.files['resume'][0].filename}`);
        if (req.files['documents']) req.files['documents'].forEach(f => deleteFile(`/uploads/${f.filename}`));
      }
      next(err);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const employee = await employeeService.getEmployeeById(id);

      deleteFile(employee.profileImage);
      deleteFile(employee.resumePath);
      if (employee.documents && employee.documents.length > 0) {
        employee.documents.forEach(doc => deleteFile(doc));
      }

      await employeeService.deleteEmployee(id, req.user.id);
      res.json({ success: true, message: 'Employee and associated documents deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeByUserId(req.user.id);
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req, res, next) {
    const userId = req.user.id;
    const { 
      name, phone, nationality, gender, age, hireType,
      educationLevel, degree, hardSkill, softSkill,
      address, postalCode, taxNumber 
    } = req.body;

    try {
      const existingEmployee = await employeeService.getEmployeeByUserId(userId);

      const updateData = {
        name: name || existingEmployee.name,
        phone: phone !== undefined ? phone : existingEmployee.phone,
        nationality: nationality !== undefined ? nationality : existingEmployee.nationality,
        gender: gender !== undefined ? gender : existingEmployee.gender,
        age: age !== undefined ? (age ? parseInt(age) : null) : existingEmployee.age,
        hireType: hireType !== undefined ? hireType : existingEmployee.hireType,
        educationLevel: educationLevel !== undefined ? educationLevel : existingEmployee.educationLevel,
        degree: degree !== undefined ? degree : existingEmployee.degree,
        hardSkill: hardSkill !== undefined ? hardSkill : existingEmployee.hardSkill,
        softSkill: softSkill !== undefined ? softSkill : existingEmployee.softSkill,
        address: address !== undefined ? address : existingEmployee.address,
        postalCode: postalCode !== undefined ? postalCode : existingEmployee.postalCode,
        taxNumber: taxNumber !== undefined ? taxNumber : existingEmployee.taxNumber,
      };

      if (req.files) {
        if (req.files['profileImage']) {
          deleteFile(existingEmployee.profileImage);
          updateData.profileImage = `/uploads/${req.files['profileImage'][0].filename}`;
        }
        if (req.files['resume']) {
          deleteFile(existingEmployee.resumePath);
          updateData.resumePath = `/uploads/${req.files['resume'][0].filename}`;
        }
        if (req.files['documents']) {
          const newDocs = req.files['documents'].map(file => `/uploads/${file.filename}`);
          updateData.documents = [...(existingEmployee.documents || []), ...newDocs];
        }
      }

      const updated = await employeeService.updateMyProfile(userId, updateData, req.user.id);
      res.json({ success: true, data: updated });
    } catch (err) {
      if (req.files) {
        if (req.files['profileImage']) deleteFile(`/uploads/${req.files['profileImage'][0].filename}`);
        if (req.files['resume']) deleteFile(`/uploads/${req.files['resume'][0].filename}`);
        if (req.files['documents']) req.files['documents'].forEach(f => deleteFile(`/uploads/${f.filename}`));
      }
      next(err);
    }
  }
}

module.exports = new EmployeeController();
