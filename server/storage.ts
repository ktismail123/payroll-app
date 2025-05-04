import { 
  User, InsertUser, Department, InsertDepartment, Designation, InsertDesignation, 
  Employee, InsertEmployee, SalaryStructure, InsertSalaryStructure, 
  Payroll, InsertPayroll, PayrollItem, InsertPayrollItem, 
  Document, InsertDocument, AuditLog, InsertAuditLog 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Memory store for sessions
const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  getAllDepartments(): Promise<Department[]>;

  // Designation operations
  getDesignation(id: number): Promise<Designation | undefined>;
  createDesignation(designation: InsertDesignation): Promise<Designation>;
  updateDesignation(id: number, designation: Partial<Designation>): Promise<Designation | undefined>;
  deleteDesignation(id: number): Promise<boolean>;
  getAllDesignations(): Promise<Designation[]>;
  getDesignationsByDepartment(departmentId: number): Promise<Designation[]>;

  // Employee operations
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(departmentId: number): Promise<Employee[]>;
  getEmployeesByManager(managerId: number): Promise<Employee[]>;
  getRecentEmployees(limit: number): Promise<Employee[]>;
  getEmployeeCount(): Promise<number>;
  getEmployeeCountByDepartment(): Promise<{ departmentId: number, departmentName: string, count: number }[]>;

  // Salary Structure operations
  getSalaryStructure(id: number): Promise<SalaryStructure | undefined>;
  getCurrentSalaryStructure(employeeId: number): Promise<SalaryStructure | undefined>;
  createSalaryStructure(salaryStructure: InsertSalaryStructure): Promise<SalaryStructure>;
  updateSalaryStructure(id: number, salaryStructure: Partial<SalaryStructure>): Promise<SalaryStructure | undefined>;
  getSalaryHistoryForEmployee(employeeId: number): Promise<SalaryStructure[]>;

  // Payroll operations
  getPayroll(id: number): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, payroll: Partial<Payroll>): Promise<Payroll | undefined>;
  getPayrollsByEmployee(employeeId: number): Promise<Payroll[]>;
  getPayrollsByPeriod(startDate: Date, endDate: Date): Promise<Payroll[]>;
  getPendingApprovalPayrolls(): Promise<Payroll[]>;
  getTotalPayroll(): Promise<number>;

  // Payroll Item operations
  getPayrollItem(id: number): Promise<PayrollItem | undefined>;
  createPayrollItem(payrollItem: InsertPayrollItem): Promise<PayrollItem>;
  getPayrollItemsByPayroll(payrollId: number): Promise<PayrollItem[]>;

  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsByEmployee(employeeId: number): Promise<Document[]>;
  deleteDocument(id: number): Promise<boolean>;

  // Audit Log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
  getRecentActivity(limit: number): Promise<AuditLog[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private designations: Map<number, Designation>;
  private employees: Map<number, Employee>;
  private salaryStructures: Map<number, SalaryStructure>;
  private payrolls: Map<number, Payroll>;
  private payrollItems: Map<number, PayrollItem>;
  private documents: Map<number, Document>;
  private auditLogs: Map<number, AuditLog>;
  
  private userCurrentId: number;
  private departmentCurrentId: number;
  private designationCurrentId: number;
  private employeeCurrentId: number;
  private salaryStructureCurrentId: number;
  private payrollCurrentId: number;
  private payrollItemCurrentId: number;
  private documentCurrentId: number;
  private auditLogCurrentId: number;
  
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.designations = new Map();
    this.employees = new Map();
    this.salaryStructures = new Map();
    this.payrolls = new Map();
    this.payrollItems = new Map();
    this.documents = new Map();
    this.auditLogs = new Map();
    
    this.userCurrentId = 1;
    this.departmentCurrentId = 1;
    this.designationCurrentId = 1;
    this.employeeCurrentId = 1;
    this.salaryStructureCurrentId = 1;
    this.payrollCurrentId = 1;
    this.payrollItemCurrentId = 1;
    this.documentCurrentId = 1;
    this.auditLogCurrentId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    this.initData();
  }

  private initData() {
    // Create default administrator user
    this.createUser({
      username: 'admin',
      password: '$2b$10$uCvWrfuRi1N37UiFLBWgSuwB3SLfzn7eIYPT8BzlDLyQmypIjHRhi', // "password" hashed
      email: 'admin@example.com',
      role: 'administrator',
      status: true
    });

    // Create some departments
    const departmentNames = ['Engineering', 'Marketing', 'Finance', 'HR', 'Sales', 'Operations'];
    departmentNames.forEach(name => {
      this.createDepartment({
        name,
        description: `${name} department`,
        managerId: null
      });
    });

    // Create some designations
    const designations = [
      { title: 'Software Developer', departmentId: 1 },
      { title: 'Marketing Specialist', departmentId: 2 },
      { title: 'Financial Analyst', departmentId: 3 },
      { title: 'HR Manager', departmentId: 4 },
      { title: 'Sales Representative', departmentId: 5 },
      { title: 'Operations Manager', departmentId: 6 }
    ];

    designations.forEach(designation => {
      this.createDesignation({
        title: designation.title,
        description: `${designation.title} role`,
        grade: 'Mid-level',
        departmentId: designation.departmentId
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, lastLogin: null };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(
      (department) => department.name === name,
    );
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentCurrentId++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department | undefined> {
    const department = await this.getDepartment(id);
    if (!department) return undefined;
    
    const updatedDepartment = { ...department, ...departmentData };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  // Designation operations
  async getDesignation(id: number): Promise<Designation | undefined> {
    return this.designations.get(id);
  }

  async createDesignation(insertDesignation: InsertDesignation): Promise<Designation> {
    const id = this.designationCurrentId++;
    const designation: Designation = { ...insertDesignation, id };
    this.designations.set(id, designation);
    return designation;
  }

  async updateDesignation(id: number, designationData: Partial<Designation>): Promise<Designation | undefined> {
    const designation = await this.getDesignation(id);
    if (!designation) return undefined;
    
    const updatedDesignation = { ...designation, ...designationData };
    this.designations.set(id, updatedDesignation);
    return updatedDesignation;
  }

  async deleteDesignation(id: number): Promise<boolean> {
    return this.designations.delete(id);
  }

  async getAllDesignations(): Promise<Designation[]> {
    return Array.from(this.designations.values());
  }

  async getDesignationsByDepartment(departmentId: number): Promise<Designation[]> {
    return Array.from(this.designations.values()).filter(
      (designation) => designation.departmentId === departmentId,
    );
  }

  // Employee operations
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.userId === userId,
    );
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.employeeId === employeeId,
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.employeeCurrentId++;
    const employee: Employee = { ...insertEmployee, id };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee | undefined> {
    const employee = await this.getEmployee(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...employeeData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      (employee) => employee.departmentId === departmentId,
    );
  }

  async getEmployeesByManager(managerId: number): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      (employee) => employee.reportingManagerId === managerId,
    );
  }

  async getRecentEmployees(limit: number): Promise<Employee[]> {
    return Array.from(this.employees.values())
      .sort((a, b) => {
        const dateA = new Date(a.joiningDate);
        const dateB = new Date(b.joiningDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  async getEmployeeCount(): Promise<number> {
    return this.employees.size;
  }

  async getEmployeeCountByDepartment(): Promise<{ departmentId: number, departmentName: string, count: number }[]> {
    const departments = await this.getAllDepartments();
    const result: { departmentId: number, departmentName: string, count: number }[] = [];
    
    for (const department of departments) {
      const employees = await this.getEmployeesByDepartment(department.id);
      result.push({
        departmentId: department.id,
        departmentName: department.name,
        count: employees.length
      });
    }
    
    return result;
  }

  // Salary Structure operations
  async getSalaryStructure(id: number): Promise<SalaryStructure | undefined> {
    return this.salaryStructures.get(id);
  }

  async getCurrentSalaryStructure(employeeId: number): Promise<SalaryStructure | undefined> {
    const now = new Date();
    
    return Array.from(this.salaryStructures.values())
      .filter(
        (salaryStructure) => 
          salaryStructure.employeeId === employeeId && 
          salaryStructure.status === true &&
          new Date(salaryStructure.effectiveFrom) <= now &&
          (!salaryStructure.effectiveTo || new Date(salaryStructure.effectiveTo) >= now)
      )
      .sort((a, b) => {
        const dateA = new Date(a.effectiveFrom);
        const dateB = new Date(b.effectiveFrom);
        return dateB.getTime() - dateA.getTime();
      })[0];
  }

  async createSalaryStructure(insertSalaryStructure: InsertSalaryStructure): Promise<SalaryStructure> {
    const id = this.salaryStructureCurrentId++;
    const salaryStructure: SalaryStructure = { ...insertSalaryStructure, id };
    this.salaryStructures.set(id, salaryStructure);
    return salaryStructure;
  }

  async updateSalaryStructure(id: number, salaryStructureData: Partial<SalaryStructure>): Promise<SalaryStructure | undefined> {
    const salaryStructure = await this.getSalaryStructure(id);
    if (!salaryStructure) return undefined;
    
    const updatedSalaryStructure = { ...salaryStructure, ...salaryStructureData };
    this.salaryStructures.set(id, updatedSalaryStructure);
    return updatedSalaryStructure;
  }

  async getSalaryHistoryForEmployee(employeeId: number): Promise<SalaryStructure[]> {
    return Array.from(this.salaryStructures.values())
      .filter((salaryStructure) => salaryStructure.employeeId === employeeId)
      .sort((a, b) => {
        const dateA = new Date(a.effectiveFrom);
        const dateB = new Date(b.effectiveFrom);
        return dateB.getTime() - dateA.getTime();
      });
  }

  // Payroll operations
  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const id = this.payrollCurrentId++;
    const payroll: Payroll = { ...insertPayroll, id };
    this.payrolls.set(id, payroll);
    return payroll;
  }

  async updatePayroll(id: number, payrollData: Partial<Payroll>): Promise<Payroll | undefined> {
    const payroll = await this.getPayroll(id);
    if (!payroll) return undefined;
    
    const updatedPayroll = { ...payroll, ...payrollData };
    this.payrolls.set(id, updatedPayroll);
    return updatedPayroll;
  }

  async getPayrollsByEmployee(employeeId: number): Promise<Payroll[]> {
    return Array.from(this.payrolls.values())
      .filter((payroll) => payroll.employeeId === employeeId)
      .sort((a, b) => {
        const dateA = new Date(a.payPeriodEnd);
        const dateB = new Date(b.payPeriodEnd);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getPayrollsByPeriod(startDate: Date, endDate: Date): Promise<Payroll[]> {
    return Array.from(this.payrolls.values())
      .filter((payroll) => {
        const payPeriodEnd = new Date(payroll.payPeriodEnd);
        return payPeriodEnd >= startDate && payPeriodEnd <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.payPeriodEnd);
        const dateB = new Date(b.payPeriodEnd);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getPendingApprovalPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values())
      .filter((payroll) => payroll.status === 'draft')
      .sort((a, b) => {
        const dateA = new Date(a.processDate);
        const dateB = new Date(b.processDate);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getTotalPayroll(): Promise<number> {
    return Array.from(this.payrolls.values())
      .filter(payroll => payroll.status === 'paid')
      .reduce((total, payroll) => {
        return total + Number(payroll.netSalary);
      }, 0);
  }

  // Payroll Item operations
  async getPayrollItem(id: number): Promise<PayrollItem | undefined> {
    return this.payrollItems.get(id);
  }

  async createPayrollItem(insertPayrollItem: InsertPayrollItem): Promise<PayrollItem> {
    const id = this.payrollItemCurrentId++;
    const payrollItem: PayrollItem = { ...insertPayrollItem, id };
    this.payrollItems.set(id, payrollItem);
    return payrollItem;
  }

  async getPayrollItemsByPayroll(payrollId: number): Promise<PayrollItem[]> {
    return Array.from(this.payrollItems.values()).filter(
      (payrollItem) => payrollItem.payrollId === payrollId,
    );
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentCurrentId++;
    const now = new Date();
    const document: Document = { ...insertDocument, id, uploadDate: now };
    this.documents.set(id, document);
    return document;
  }

  async getDocumentsByEmployee(employeeId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((document) => document.employeeId === employeeId)
      .sort((a, b) => {
        const dateA = new Date(a.uploadDate);
        const dateB = new Date(b.uploadDate);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Audit Log operations
  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogCurrentId++;
    const now = new Date();
    const auditLog: AuditLog = { ...insertAuditLog, id, timestamp: now };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getAuditLogs(limit: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  async getAuditLogsByUser(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter((auditLog) => auditLog.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter((auditLog) => auditLog.entityType === entityType && auditLog.entityId === entityId)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getRecentActivity(limit: number): Promise<AuditLog[]> {
    return this.getAuditLogs(limit);
  }
}

export const storage = new MemStorage();
