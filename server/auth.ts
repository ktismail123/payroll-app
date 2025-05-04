import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, userAuthSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "employee-payroll-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Update last login time
          await storage.updateUser(user.id, { lastLogin: new Date() });
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = userAuthSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: 'register',
        entityType: 'user',
        entityId: user.id,
        details: `User ${user.username} registered`
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      passport.authenticate("local", async (err: Error, user?: SelectUser) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }

        req.login(user, async (err) => {
          if (err) return next(err);

          // Create audit log
          await storage.createAuditLog({
            userId: user.id,
            action: 'login',
            entityType: 'user',
            entityId: user.id,
            details: `User ${user.username} logged in`
          });

          // Don't send password back to client
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/logout", async (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
      const userId = req.user.id;
      const username = req.user.username;
      
      try {
        // Create audit log
        await storage.createAuditLog({
          userId,
          action: 'logout',
          entityType: 'user',
          entityId: userId,
          details: `User ${username} logged out`
        });
      } catch (error) {
        console.error("Failed to create audit log for logout:", error);
      }
    }

    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Check if user has required role
  app.get("/api/check-role", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const role = req.query.role as string;
    const userRole = req.user.role;
    
    // Role hierarchy: administrator > hr_manager > hr_staff > employee
    const roleHierarchy = {
      administrator: 4,
      hr_manager: 3,
      hr_staff: 2,
      employee: 1
    };
    
    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[role as keyof typeof roleHierarchy];
    
    if (!requiredRoleLevel) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const hasAccess = userRoleLevel >= requiredRoleLevel;
    
    res.json({ hasAccess });
  });
}
