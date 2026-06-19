import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sucihome-super-secret-jwt-key-2026-vrc-pvt-ltd';

export interface AdminRequest extends Request {
  admin?: any;
}

export function authenticateAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Admin authentication required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.adminId) {
      return res.status(403).json({ 
        error: 'Admin access only' 
      });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired session' 
    });
  }
}
