import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { authenticateAdmin } from '../middleware/adminAuth';
import { authenticateEmployee } from '../middleware/employeeAuth';
import prisma from '../db/prisma';
import { alertHRPayoutRequest, sendPayoutConfirmation } from '../utils/notifications';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sucihome-super-secret-jwt-key-2026-vrc-pvt-ltd';

// Rate Limiting for employee login (5 attempts per 15 minutes)
const employeeLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── ADMIN: Create an employee from application ──
router.post('/admin/employees/hire', authenticateAdmin, async (req, res) => {
  const adminId = (req as any).admin.adminId;
  try {
    const { applicationId, pin } = req.body;
    if (!applicationId || !pin) {
      return res.status(400).json({ error: 'Application ID and PIN are required' });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be a 4-digit number' });
    }

    // Find the application
    const app = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if employee already exists for this application
    const existingEmployee = await prisma.employee.findUnique({
      where: { applicationId: app.id }
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee record already exists for this candidate' });
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create the Employee
    const employee = await prisma.employee.create({
      data: {
        applicationId: app.id,
        fullName: app.fullName,
        mobile: app.mobile,
        email: app.email,
        city: app.city,
        jobPosition: app.position,
        employeePin: hashedPin,
        status: 'HIRED',
        isActive: true,
      }
    });

    // Update application status to SHORTLISTED (if not already)
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'SHORTLISTED' }
    });

    console.log(`[AUDIT LOG] [${new Date().toISOString()}] Admin ${adminId} hired candidate ${app.fullName} (App ID: ${app.id}, Emp ID: ${employee.id})`);

    res.json({ success: true, employee });
  } catch (error: any) {
    console.error('Error hiring employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: Get all active employees for searchable dropdown ──
router.get('/admin/employees/active', authenticateAdmin, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        mobile: true,
        jobPosition: true,
        city: true,
      },
      orderBy: { fullName: 'asc' },
    });
    res.json({ employees });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: Add/Update daily earning for a cleaner ──
router.post('/admin/log', authenticateAdmin, async (req, res) => {
  const adminId = (req as any).admin.adminId;
  try {
    const { employeeId, date, jobsCompleted, baseAmount, bonusAmount, notes } = req.body;
    
    if (!employeeId || !date || baseAmount === undefined) {
      return res.status(400).json({ error: 'Employee ID, date, and base amount are required' });
    }

    const total = parseFloat(baseAmount) + parseFloat(bonusAmount || 0);

    const earning = await prisma.dailyEarning.upsert({
      where: { 
        employeeId_date: { 
          employeeId, 
          date: new Date(date) 
        } 
      },
      update: {
        jobsCompleted: parseInt(jobsCompleted) || 0,
        baseAmount   : parseFloat(baseAmount),
        bonusAmount  : parseFloat(bonusAmount || 0),
        totalAmount  : total,
        notes        : notes || null,
      },
      create: {
        employeeId,
        date         : new Date(date),
        jobsCompleted: parseInt(jobsCompleted) || 0,
        baseAmount   : parseFloat(baseAmount),
        bonusAmount  : parseFloat(bonusAmount || 0),
        totalAmount  : total,
        notes        : notes || null,
        addedBy      : adminId,
      }
    });

    console.log(`[AUDIT LOG] [${new Date().toISOString()}] Admin ${adminId} logged daily earning for Employee ${employeeId} on ${date}. Total: ₹${total}`);

    res.json({ success: true, earning });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: List all earnings (filterable) ──
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { employeeId, fromDate, toDate, status, city } = req.query;

    const earnings = await prisma.dailyEarning.findMany({
      where: {
        ...(employeeId ? { employeeId: String(employeeId) } : {}),
        ...(status ? { status: status as any } : {}),
        ...(fromDate && toDate ? {
          date: {
            gte: new Date(String(fromDate)),
            lte: new Date(String(toDate)),
          }
        } : {}),
        ...(city ? { employee: { city: String(city) } } : {}),
      },
      include: {
        employee: {
          select: { fullName: true, mobile: true, jobPosition: true, city: true }
        }
      },
      orderBy: { date: 'desc' },
    });

    res.json({ earnings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: Bulk mark earnings as paid ──
router.post('/admin/bulk-pay', authenticateAdmin, async (req, res) => {
  const adminId = (req as any).admin.adminId;
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const updated = await prisma.dailyEarning.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PAID' }
    });

    console.log(`[AUDIT LOG] [${new Date().toISOString()}] Admin ${adminId} marked ${updated.count} daily earnings entries as PAID`);

    res.json({ success: true, count: updated.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: All pending/approved payout requests ──
router.get('/admin/payout-requests', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    const requests = await prisma.payoutRequest.findMany({
      where: status ? { status: status as any } : {},
      include: {
        employee: {
          select: { fullName: true, mobile: true, jobPosition: true, city: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: Approve/Reject/Mark Paid a payout ──
router.patch('/admin/payout-requests/:id', authenticateAdmin, async (req, res) => {
  const adminId = (req as any).admin.adminId;
  try {
    const { status, adminNotes, paidVia } = req.body;
    const { id } = req.params;

    if (!['PENDING', 'APPROVED', 'REJECTED', 'PAID'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Retrieve previous request to make sure it exists
    const request = await prisma.payoutRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Payout request not found' });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data : {
        status,
        adminNotes: adminNotes || null,
        ...(status === 'PAID' ? { 
          paidAt: new Date(), 
          paidVia: paidVia || null 
        } : {}),
      }
    });

    // Mark related earnings as PAID
    if (status === 'PAID') {
      await prisma.dailyEarning.updateMany({
        where: {
          employeeId: updated.employeeId,
          date: { gte: updated.fromDate, lte: updated.toDate },
        },
        data: { status: 'PAID' }
      });

      // Send WhatsApp confirmation
      await sendPayoutConfirmation(updated);
    }

    console.log(`[AUDIT LOG] [${new Date().toISOString()}] Admin ${adminId} updated Payout Request ${id} status to ${status}. Notes: ${adminNotes || 'None'}`);

    res.json({ success: true, request: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── ADMIN: Earnings summary stats ──
router.get('/admin/summary', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [todayTotal, pendingPayouts, monthTotal, activeCleaners] = await Promise.all([
      prisma.dailyEarning.aggregate({
        where: { date: today },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.payoutRequest.count({
        where: { status: 'PENDING' }
      }),
      prisma.dailyEarning.aggregate({
        where: { 
          date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } 
        },
        _sum: { totalAmount: true },
      }),
      prisma.employee.count({
        where: { jobPosition: 'CLEANER', isActive: true }
      }),
    ]);

    res.json({
      todayTotal     : todayTotal._sum.totalAmount || 0,
      todayJobsLogged: todayTotal._count,
      pendingPayouts,
      monthTotal     : monthTotal._sum.totalAmount || 0,
      activeCleaners,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── EMPLOYEE LOGIN (mobile + 4-digit PIN) ──
router.post('/employee/login', employeeLoginLimiter, async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    if (!mobile || !pin) {
      return res.status(400).json({ error: 'Mobile number and PIN are required' });
    }

    const employee = await prisma.employee.findFirst({
      where: { mobile: mobile.trim(), status: 'HIRED', isActive: true }
    });

    if (!employee || !employee.employeePin) {
      return res.status(401).json({ 
        error: 'Invalid mobile number or PIN' 
      });
    }

    const isValidPin = await bcrypt.compare(pin, employee.employeePin);
    if (!isValidPin) {
      return res.status(401).json({ 
        error: 'Invalid mobile number or PIN' 
      });
    }

    const token = jwt.sign(
      { employeeId: employee.id, mobile: employee.mobile },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      token, 
      employee: { 
        name: employee.fullName, 
        id: employee.applicationId || employee.id,
        role: employee.jobPosition,
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── EMPLOYEE: My earnings ──
router.get('/employee/my-earnings', authenticateEmployee, async (req, res) => {
  try {
    const employeeId = (req as any).employee.employeeId;
    const { month } = req.query; // e.g. "2026-06"

    const start = month 
      ? new Date(`${month}-01T00:00:00`) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    const earnings = await prisma.dailyEarning.findMany({
      where: { 
        employeeId, 
        date: { gte: start, lte: end } 
      },
      orderBy: { date: 'desc' },
    });

    const totalEarned = earnings.reduce(
      (sum: number, e: any) => sum + Number(e.totalAmount), 0
    );
    const totalUnpaid = earnings
      .filter((e: any) => e.status === 'UNPAID')
      .reduce((sum: number, e: any) => sum + Number(e.totalAmount), 0);

    res.json({ earnings, totalEarned, totalUnpaid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── EMPLOYEE: Request payout ──
router.post('/employee/request-payout', authenticateEmployee, async (req, res) => {
  try {
    const employeeId = (req as any).employee.employeeId;
    const { fromDate, toDate, method, upiId, bankAccount, bankIfsc } = req.body;

    if (!fromDate || !toDate || !method) {
      return res.status(400).json({ error: 'From date, to date, and method are required' });
    }

    // Always server-calculate the payout amount from DailyEarning records!
    const unpaidEarnings = await prisma.dailyEarning.findMany({
      where: {
        employeeId,
        status: 'UNPAID',
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      }
    });

    if (!unpaidEarnings.length) {
      return res.status(400).json({ 
        error: 'No unpaid earnings in this date range' 
      });
    }

    const amount = unpaidEarnings.reduce(
      (sum: number, e: any) => sum + Number(e.totalAmount), 0
    );

    const requestId = `SH-PAY-${Date.now().toString(36).toUpperCase()}`;

    const request = await prisma.payoutRequest.create({
      data: {
        requestId,
        employeeId,
        amount,
        fromDate : new Date(fromDate),
        toDate   : new Date(toDate),
        method,
        upiId       : upiId || null,
        bankAccount : bankAccount || null,
        bankIfsc    : bankIfsc || null,
        status      : 'PENDING',
      }
    });

    // Mark earnings as requested
    await prisma.dailyEarning.updateMany({
      where: { id: { in: unpaidEarnings.map((e: any) => e.id) } },
      data : { status: 'REQUESTED' }
    });

    // Alert HR
    await alertHRPayoutRequest(request);

    res.status(201).json({ success: true, request });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── EMPLOYEE: My payout history ──
router.get('/employee/my-payouts', authenticateEmployee, async (req, res) => {
  try {
    const employeeId = (req as any).employee.employeeId;
    const requests = await prisma.payoutRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
