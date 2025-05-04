import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertDepartmentSchema, insertDesignationSchema, insertEmployeeSchema, 
  insertSalaryStructureSchema, insertPayrollSchema, insertPayrollItemSchema,
  insertDocumentSchema
} from "@shared/schema";

// Check if user has admin or HR manager role
const checkAdminOrHRManager = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userRole = req.user.role;
  if (userRole !== 'administrator' && userRole !== 'hr_manager') {
    return res.status(403).json({ message: "Forbidden: Requires administrator or HR manager role" });
  }
  
  next();
};

// Check if user has admin, HR manager, or HR staff role
const checkHRAccess = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userRole = req.user.role;
  if (userRole !== 'administrator' && userRole !== 'hr_manager' && userRole !== 'hr_staff') {
    return res.status(403).json({ message: "Forbidden: Requires HR access" });
  }
  
  next();
};

// Helper to create audit logs
const createAuditLog = async (userId: number, action: string, entityType: string, entityId: number, details: string) => {
  try {
    await storage.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      details
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const department = await storage.getDepartment(Number(req.params.id));
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/departments", checkAdminOrHRManager, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const existingDepartment = await storage.getDepartmentByName(departmentData.name);
      if (existingDepartment) {
        return res.status(400).json({ message: "Department name already exists" });
      }
      
      const department = await storage.createDepartment(departmentData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'create',
        'department',
        department.id,
        `Department ${department.name} created`
      );
      
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/departments/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      if (departmentData.name && departmentData.name !== department.name) {
        const existingDepartment = await storage.getDepartmentByName(departmentData.name);
        if (existingDepartment) {
          return res.status(400).json({ message: "Department name already exists" });
        }
      }
      
      const updatedDepartment = await storage.updateDepartment(id, departmentData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'update',
        'department',
        id,
        `Department ${updatedDepartment?.name} updated`
      );
      
      res.json(updatedDepartment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/departments/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      const employees = await storage.getEmployeesByDepartment(id);
      if (employees.length > 0) {
        return res.status(400).json({ message: "Cannot delete department with employees" });
      }
      
      const success = await storage.deleteDepartment(id);
      
      if (success) {
        // Create audit log
        await createAuditLog(
          req.user.id,
          'delete',
          'department',
          id,
          `Department ${department.name} deleted`
        );
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete department" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Designation routes
  app.get("/api/designations", async (req, res) => {
    try {
      const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
      
      let designations;
      if (departmentId) {
        designations = await storage.getDesignationsByDepartment(departmentId);
      } else {
        designations = await storage.getAllDesignations();
      }
      
      res.json(designations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/designations/:id", async (req, res) => {
    try {
      const designation = await storage.getDesignation(Number(req.params.id));
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }
      res.json(designation);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/designations", checkAdminOrHRManager, async (req, res) => {
    try {
      const designationData = insertDesignationSchema.parse(req.body);
      
      // Check if department exists
      if (designationData.departmentId) {
        const department = await storage.getDepartment(designationData.departmentId);
        if (!department) {
          return res.status(400).json({ message: "Department not found" });
        }
      }
      
      const designation = await storage.createDesignation(designationData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'create',
        'designation',
        designation.id,
        `Designation ${designation.title} created`
      );
      
      res.status(201).json(designation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/designations/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const designationData = insertDesignationSchema.partial().parse(req.body);
      
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }
      
      // Check if department exists if updating department
      if (designationData.departmentId) {
        const department = await storage.getDepartment(designationData.departmentId);
        if (!department) {
          return res.status(400).json({ message: "Department not found" });
        }
      }
      
      const updatedDesignation = await storage.updateDesignation(id, designationData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'update',
        'designation',
        id,
        `Designation ${updatedDesignation?.title} updated`
      );
      
      res.json(updatedDesignation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/designations/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const designation = await storage.getDesignation(id);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }
      
      const success = await storage.deleteDesignation(id);
      
      if (success) {
        // Create audit log
        await createAuditLog(
          req.user.id,
          'delete',
          'designation',
          id,
          `Designation ${designation.title} deleted`
        );
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete designation" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Employee routes
  app.get("/api/employees", checkHRAccess, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/employees/recent", checkHRAccess, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const employees = await storage.getRecentEmployees(limit);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/employees/count", checkHRAccess, async (req, res) => {
    try {
      const count = await storage.getEmployeeCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/employees/departments/count", checkHRAccess, async (req, res) => {
    try {
      const departmentCounts = await storage.getEmployeeCountByDepartment();
      res.json(departmentCounts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check access permissions
      if (req.user.role === 'employee' && req.user.id !== employee.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/employees", checkHRAccess, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      
      // Generate unique employee ID
      const employeeId = `EMP${Date.now().toString().slice(-8)}`;
      const employee = await storage.createEmployee({
        ...employeeData,
        employeeId
      });
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'create',
        'employee',
        employee.id,
        `Employee ${employee.firstName} ${employee.lastName} created`
      );
      
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/employees/:id", checkHRAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'update',
        'employee',
        id,
        `Employee ${updatedEmployee?.firstName} ${updatedEmployee?.lastName} updated`
      );
      
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/employees/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Soft delete by updating status to 'inactive'
      const updatedEmployee = await storage.updateEmployee(id, { status: 'terminated' });
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'delete',
        'employee',
        id,
        `Employee ${employee.firstName} ${employee.lastName} terminated`
      );
      
      res.json(updatedEmployee);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Salary Structure routes
  app.get("/api/salary-structures/employee/:employeeId", checkHRAccess, async (req, res) => {
    try {
      const employeeId = Number(req.params.employeeId);
      
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const salaryStructures = await storage.getSalaryHistoryForEmployee(employeeId);
      res.json(salaryStructures);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/salary-structures/current/:employeeId", async (req, res) => {
    try {
      const employeeId = Number(req.params.employeeId);
      
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check access permissions for employee role
      if (req.user.role === 'employee' && req.user.id !== employee.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const salaryStructure = await storage.getCurrentSalaryStructure(employeeId);
      
      if (!salaryStructure) {
        return res.status(404).json({ message: "Salary structure not found" });
      }
      
      res.json(salaryStructure);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/salary-structures", checkAdminOrHRManager, async (req, res) => {
    try {
      const salaryData = insertSalaryStructureSchema.parse(req.body);
      
      const employee = await storage.getEmployee(salaryData.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // If setting up a new active salary structure, set previous ones to inactive
      if (salaryData.status) {
        const currentSalary = await storage.getCurrentSalaryStructure(salaryData.employeeId);
        if (currentSalary) {
          await storage.updateSalaryStructure(currentSalary.id, { 
            status: false,
            effectiveTo: new Date(salaryData.effectiveFrom)
          });
        }
      }
      
      const salaryStructure = await storage.createSalaryStructure(salaryData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'create',
        'salary',
        salaryStructure.id,
        `Salary structure created for employee ID ${employee.employeeId}`
      );
      
      res.status(201).json(salaryStructure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.put("/api/salary-structures/:id", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const salaryData = insertSalaryStructureSchema.partial().parse(req.body);
      
      const salaryStructure = await storage.getSalaryStructure(id);
      if (!salaryStructure) {
        return res.status(404).json({ message: "Salary structure not found" });
      }
      
      const updatedSalaryStructure = await storage.updateSalaryStructure(id, salaryData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'update',
        'salary',
        id,
        `Salary structure updated for employee ID ${salaryStructure.employeeId}`
      );
      
      res.json(updatedSalaryStructure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Payroll routes
  app.get("/api/payrolls", checkHRAccess, async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
      
      let payrolls;
      if (employeeId) {
        payrolls = await storage.getPayrollsByEmployee(employeeId);
      } else if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        payrolls = await storage.getPayrollsByPeriod(startDate, endDate);
      } else {
        // Return pending approval payrolls by default
        payrolls = await storage.getPendingApprovalPayrolls();
      }
      
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/payrolls/pending", checkAdminOrHRManager, async (req, res) => {
    try {
      const pendingPayrolls = await storage.getPendingApprovalPayrolls();
      res.json(pendingPayrolls);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/payrolls/total", checkAdminOrHRManager, async (req, res) => {
    try {
      const totalPayroll = await storage.getTotalPayroll();
      res.json({ totalPayroll });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/payrolls/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const payroll = await storage.getPayroll(id);
      
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      // Get the employee to check permissions
      const employee = await storage.getEmployee(payroll.employeeId);
      
      // Check access permissions for employee role
      if (req.user.role === 'employee' && employee && req.user.id !== employee.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get payroll items
      const payrollItems = await storage.getPayrollItemsByPayroll(id);
      
      res.json({
        ...payroll,
        items: payrollItems
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/payrolls", checkAdminOrHRManager, async (req, res) => {
    try {
      const payrollData = insertPayrollSchema.parse(req.body);
      
      const employee = await storage.getEmployee(payrollData.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Process date is now
      const processDate = new Date();
      const payroll = await storage.createPayroll({
        ...payrollData,
        processDate
      });
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'create',
        'payroll',
        payroll.id,
        `Payroll created for employee ID ${employee.employeeId}`
      );
      
      res.status(201).json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/payrolls/:id/approve", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const payroll = await storage.getPayroll(id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      if (payroll.status !== 'draft') {
        return res.status(400).json({ message: "Payroll is already approved or paid" });
      }
      
      const approvalDate = new Date();
      const updatedPayroll = await storage.updatePayroll(id, {
        status: 'approved',
        approvedBy: req.user.id,
        approvalDate
      });
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'approve',
        'payroll',
        id,
        `Payroll approved for employee ID ${payroll.employeeId}`
      );
      
      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/payrolls/:id/mark-paid", checkAdminOrHRManager, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const payroll = await storage.getPayroll(id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      if (payroll.status !== 'approved') {
        return res.status(400).json({ message: "Payroll must be approved before marking as paid" });
      }
      
      const updatedPayroll = await storage.updatePayroll(id, {
        status: 'paid'
      });
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'paid',
        'payroll',
        id,
        `Payroll marked as paid for employee ID ${payroll.employeeId}`
      );
      
      res.json(updatedPayroll);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Payroll Items routes
  app.post("/api/payroll-items", checkAdminOrHRManager, async (req, res) => {
    try {
      const payrollItemData = insertPayrollItemSchema.parse(req.body);
      
      const payroll = await storage.getPayroll(payrollItemData.payrollId);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      
      if (payroll.status !== 'draft') {
        return res.status(400).json({ message: "Cannot modify items for approved or paid payroll" });
      }
      
      const payrollItem = await storage.createPayrollItem(payrollItemData);
      
      // Update payroll totals
      const allItems = await storage.getPayrollItemsByPayroll(payroll.id);
      
      let totalEarnings = 0;
      let totalDeductions = 0;
      
      allItems.forEach(item => {
        if (item.itemType === 'earning') {
          totalEarnings += Number(item.amount);
        } else {
          totalDeductions += Number(item.amount);
        }
      });
      
      const netSalary = Number(payroll.basicSalary) + totalEarnings - totalDeductions;
      
      await storage.updatePayroll(payroll.id, {
        totalEarnings,
        totalDeductions,
        netSalary
      });
      
      res.status(201).json(payrollItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Document routes
  app.get("/api/documents/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = Number(req.params.employeeId);
      
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check access permissions for employee role
      if (req.user.role === 'employee' && req.user.id !== employee.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocumentsByEmployee(employeeId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/documents", checkHRAccess, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      
      const employee = await storage.getEmployee(documentData.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const document = await storage.createDocument(documentData);
      
      // Create audit log
      await createAuditLog(
        req.user.id,
        'upload',
        'document',
        document.id,
        `Document ${document.documentName} uploaded for employee ID ${employee.employeeId}`
      );
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/documents/:id", checkHRAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const success = await storage.deleteDocument(id);
      
      if (success) {
        // Create audit log
        await createAuditLog(
          req.user.id,
          'delete',
          'document',
          id,
          `Document ${document.documentName} deleted`
        );
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Dashboard data
  app.get("/api/dashboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const employeeCount = await storage.getEmployeeCount();
      const totalPayroll = await storage.getTotalPayroll();
      const departments = await storage.getAllDepartments();
      const pendingPayrolls = await storage.getPendingApprovalPayrolls();
      const recentEmployees = await storage.getRecentEmployees(4);
      const recentActivity = await storage.getRecentActivity(5);
      const departmentCounts = await storage.getEmployeeCountByDepartment();
      
      res.json({
        stats: {
          employeeCount,
          totalPayroll,
          departmentCount: departments.length,
          pendingApprovalsCount: pendingPayrolls.length
        },
        recentEmployees,
        recentActivity,
        departmentCounts
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Audit Log routes for admins
  app.get("/api/audit-logs", checkAdminOrHRManager, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const auditLogs = await storage.getAuditLogs(limit);
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
