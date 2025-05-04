import { pgTable, text, serial, integer, boolean, date, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['administrator', 'hr_manager', 'hr_staff', 'employee']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const bloodGroupEnum = pgEnum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
export const maritalStatusEnum = pgEnum('marital_status', ['single', 'married', 'divorced', 'widowed']);
export const employmentTypeEnum = pgEnum('employment_type', ['full_time', 'part_time', 'contract']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'inactive', 'terminated']);
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'paid']);
export const payrollItemTypeEnum = pgEnum('payroll_item_type', ['earning', 'deduction']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('employee'),
  status: boolean("status").notNull().default(true),
  lastLogin: timestamp("last_login"),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id").references(() => employees.id),
});

// Designations table
export const designations = pgTable("designations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  grade: text("grade"),
  departmentId: integer("department_id").references(() => departments.id),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  employeeId: text("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  bloodGroup: bloodGroupEnum("blood_group"),
  maritalStatus: maritalStatusEnum("marital_status"),
  phoneNumber: text("phone_number"),
  email: text("email").notNull(),
  permanentAddress: text("permanent_address"),
  currentAddress: text("current_address"),
  emergencyContact: text("emergency_contact"),
  joiningDate: date("joining_date").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  designationId: integer("designation_id").references(() => designations.id),
  reportingManagerId: integer("reporting_manager_id").references(() => employees.id),
  employmentType: employmentTypeEnum("employment_type").default('full_time'),
  status: employeeStatusEnum("status").default('active'),
  profilePhoto: text("profile_photo"),
});

// Salary Structure table
export const salaryStructures = pgTable("salary_structures", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  houseRentAllowance: decimal("house_rent_allowance", { precision: 10, scale: 2 }),
  conveyanceAllowance: decimal("conveyance_allowance", { precision: 10, scale: 2 }),
  medicalAllowance: decimal("medical_allowance", { precision: 10, scale: 2 }),
  specialAllowance: decimal("special_allowance", { precision: 10, scale: 2 }),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  status: boolean("status").notNull().default(true),
});

// Payroll table
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  payPeriodStart: date("pay_period_start").notNull(),
  payPeriodEnd: date("pay_period_end").notNull(),
  processDate: timestamp("process_date").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull(),
  totalDeductions: decimal("total_deductions", { precision: 10, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  status: payrollStatusEnum("status").default('draft'),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
});

// Payroll Items table
export const payrollItems = pgTable("payroll_items", {
  id: serial("id").primaryKey(),
  payrollId: integer("payroll_id").references(() => payrolls.id).notNull(),
  itemType: payrollItemTypeEnum("item_type").notNull(),
  itemName: text("item_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
});

// Document table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  documentPath: text("document_path").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertDesignationSchema = createInsertSchema(designations).omit({ id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertSalaryStructureSchema = createInsertSchema(salaryStructures).omit({ id: true });
export const insertPayrollSchema = createInsertSchema(payrolls).omit({ id: true, approvalDate: true });
export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadDate: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });

// Registration and Auth schemas
export const userAuthSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['administrator', 'hr_manager', 'hr_staff', 'employee']).default('employee'),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Designation = typeof designations.$inferSelect;
export type InsertDesignation = z.infer<typeof insertDesignationSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type InsertSalaryStructure = z.infer<typeof insertSalaryStructureSchema>;
export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type UserAuth = z.infer<typeof userAuthSchema>;
export type Login = z.infer<typeof loginSchema>;
