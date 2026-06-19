import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedEmployeeRequest extends Request {
  employee?: {
    employeeId: string;
    mobile: string;
  };
}

export function authenticateEmployee(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'sucihome-super-secret-jwt-key-2026-vrc-pvt-ltd';
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (!decoded.employeeId) {
      return res.status(403).json({ error: 'Invalid session' });
    }
    (req as any).employee = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired' });
  }
}
