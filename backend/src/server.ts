import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './db/prisma';
import { multerUpload, uploadToCloudinaryOrLocal } from './utils/uploader';
import { encryptAadhaar, decryptAadhaar, hashAadhaar } from './utils/crypto';
import { sendRegistrationNotifications, sendWhatsApp } from './utils/notifications';
import { requireAdmin, AuthenticatedRequest } from './middleware/auth';
import { authenticateAdmin } from './middleware/adminAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sucihome-super-secret-jwt-key-2026-vrc-pvt-ltd';

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with your frontend URL
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve uploaded files statically for local development fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Rate Limiter for Registration (5 submissions per IP per hour)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many registration requests from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generate Unique Application ID: SH-EMP-YYYYMMDD-XXXXX
 */
async function generateUniqueApplicationId(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  let attempts = 0;
  while (attempts < 100) {
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const appId = `SH-EMP-${dateStr}-${randomPart}`;
    
    // Ensure uniqueness in the database
    const existing = await prisma.application.findUnique({
      where: { id: appId },
    });
    if (!existing) {
      return appId;
    }
    attempts++;
  }
  throw new Error('Failed to generate unique application ID after 100 attempts');
}

/**
 * Endpoint: Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

/**
 * Endpoint: Register Employee
 */
app.post(
  '/api/register',
  registrationLimiter,
  multerUpload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Basic validations
      if (!files?.photo?.[0]) return res.status(400).json({ error: 'Photo is required' });
      if (!files?.aadhaarFront?.[0]) return res.status(400).json({ error: 'Aadhaar Front image is required' });
      if (!files?.aadhaarBack?.[0]) return res.status(400).json({ error: 'Aadhaar Back image is required' });

      const {
        fullName,
        mobile,
        email,
        gender,
        dateOfBirth,
        aadhaar,
        address,
        city,
        state,
        pinCode,
        position,
        experience,
        preferredCities,
        expectedSalary,
      } = req.body;

      // Validate required string fields
      if (!fullName || !mobile || !email || !gender || !dateOfBirth || !aadhaar || !address || !city || !state || !pinCode || !position || !expectedSalary) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Aadhaar format verification (12 digits)
      const cleanAadhaar = aadhaar.trim();
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return res.status(400).json({ error: 'Aadhaar number must be exactly 12 digits' });
      }

      // Check for duplicate Aadhaar
      const targetHash = hashAadhaar(cleanAadhaar);
      const duplicateAadhaar = await prisma.application.findUnique({
        where: { aadhaarHash: targetHash },
      });
      if (duplicateAadhaar) {
        return res.status(400).json({ error: 'This Aadhaar number is already registered' });
      }

      // Check duplicate Mobile
      const duplicateMobile = await prisma.application.findUnique({
        where: { mobile: mobile.trim() },
      });
      if (duplicateMobile) {
        return res.status(400).json({ error: 'This mobile number is already registered' });
      }

      // Check duplicate Email
      const duplicateEmail = await prisma.application.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (duplicateEmail) {
        return res.status(400).json({ error: 'This email is already registered' });
      }

      // Parse cities list
      let parsedCities: string[] = [];
      if (preferredCities) {
        try {
          parsedCities = Array.isArray(preferredCities) 
            ? preferredCities 
            : JSON.parse(preferredCities);
        } catch {
          parsedCities = preferredCities.split(',').map((c: string) => c.trim());
        }
      }

      // Upload files
      const reqHost = req.get('host') || 'localhost:5000';
      const photoUrl = await uploadToCloudinaryOrLocal(files.photo[0], reqHost);
      const aadhaarFrontUrl = await uploadToCloudinaryOrLocal(files.aadhaarFront[0], reqHost);
      const aadhaarBackUrl = await uploadToCloudinaryOrLocal(files.aadhaarBack[0], reqHost);
      
      let resumeUrl = '';
      if (files?.resume?.[0]) {
        resumeUrl = await uploadToCloudinaryOrLocal(files.resume[0], reqHost);
      }

      // Encrypt Aadhaar number
      const encryptedAadhaar = encryptAadhaar(cleanAadhaar);

      // Generate application ID
      const applicationId = await generateUniqueApplicationId();

      // Save to database
      const application = await prisma.application.create({
        data: {
          id: applicationId,
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          email: email.trim().toLowerCase(),
          gender: gender.trim(),
          dateOfBirth: new Date(dateOfBirth),
          aadhaarEnc: encryptedAadhaar,
          aadhaarHash: targetHash,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          position: position.toUpperCase().replace(' ', '_'),
          experience: parseInt(experience, 10),
          preferredCities: parsedCities,
          expectedSalary: parseFloat(expectedSalary),
          photoUrl,
          aadhaarFrontUrl,
          aadhaarBackUrl,
          resumeUrl: resumeUrl || null,
        },
      });

      // Send WhatsApp and Email Notifications (runs async)
      sendRegistrationNotifications({
        applicationId: application.id,
        fullName: application.fullName,
        mobile: application.mobile,
        email: application.email,
        position: application.position,
        experience: application.experience,
        expectedSalary: application.expectedSalary,
      }).catch(err => console.error('Notification trigger failed:', err));

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        applicationId: application.id,
      });

    } catch (error: any) {
      console.error('Registration API Error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
);

/**
 * Endpoint: Status check by ID (unprotected, details masked)
 */
app.get('/api/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        position: true,
        status: true,
        createdAt: true,
        email: true,
        mobile: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json(application);
  } catch (error: any) {
    return res.status(500).json({ error: 'Server error retrieving status' });
  }
});

/**
 * Endpoint: Admin Login
 */
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        name: admin.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * Endpoint: Secure Admin Login
 */
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({
      where: { username: email }
    });

    if (!admin) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email  : admin.username,
        name   : admin.name
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      admin: {
        email: admin.username,
        name: admin.name
      }
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Endpoint: Admin Stats
 */
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const total = await prisma.application.count();
    const pending = await prisma.application.count({ where: { status: 'PENDING' } });
    const shortlisted = await prisma.application.count({ where: { status: 'SHORTLISTED' } });
    const rejected = await prisma.application.count({ where: { status: 'REJECTED' } });

    return res.json({
      total,
      pending,
      shortlisted,
      rejected,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching stats' });
  }
});

/**
 * Endpoint: List Admin Applications (Search, Filters)
 */
app.get('/api/admin/applications', authenticateAdmin, async (req, res) => {
  try {
    const { search, status, position } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }
    if (position) {
      whereClause.position = position;
    }

    if (search) {
      const searchStr = String(search).trim();
      whereClause.OR = [
        { id: { contains: searchStr, mode: 'insensitive' } },
        { fullName: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { mobile: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt Aadhaar numbers for admin review and mask sensitive display
    const decryptedApplications = applications.map(app => {
      const decryptedAadhaar = decryptAadhaar(app.aadhaarEnc);
      return {
        ...app,
        aadhaarDecrypted: decryptedAadhaar,
        aadhaarMasked: decryptedAadhaar !== 'DECRYPTION_FAILED' 
          ? `XXXX-XXXX-${decryptedAadhaar.slice(-4)}` 
          : 'XXXX-XXXX-XXXX',
      };
    });

    return res.json(decryptedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Server error fetching applications' });
  }
});

/**
 * Endpoint: Update Application Status
 */
app.patch('/api/admin/applications/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'SHORTLISTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Notify applicant of status update (Mock notification on status changes)
    const statusMsg = `Hi ${updated.fullName}, the status of your SuciHome application (${updated.id}) has been updated to: ${status}. Thank you!`;
    sendWhatsApp(updated.mobile, statusMsg, 'Applicant Status Change').catch(err =>
      console.error('Status change notification failed:', err)
    );

    return res.json({ success: true, updated });
  } catch (error) {
    return res.status(500).json({ error: 'Server error updating status' });
  }
});

/**
 * Endpoint: Bulk WhatsApp Messaging
 */
app.post('/api/admin/applications/bulk-whatsapp', authenticateAdmin, async (req, res) => {
  try {
    const { ids, message } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !message) {
      return res.status(400).json({ error: 'Invalid parameters. Need list of application IDs and a message.' });
    }

    const applications = await prisma.application.findMany({
      where: { id: { in: ids } },
      select: { mobile: true, fullName: true },
    });

    let successCount = 0;
    for (const app of applications) {
      const personalizedMsg = message.replace(/{name}/g, app.fullName);
      const sent = await sendWhatsApp(app.mobile, personalizedMsg, `Bulk Applicant (${app.fullName})`);
      if (sent) successCount++;
    }

    return res.json({
      success: true,
      message: `Successfully queued/sent bulk messages. Sent ${successCount}/${applications.length}.`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error sending bulk WhatsApp' });
  }
});

/**
 * Endpoint: Export CSV
 */
app.get('/api/admin/applications/export', authenticateAdmin, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
    });

    let csvContent = 'Application ID,Name,Mobile,Email,Gender,DOB,Aadhaar,Position,Experience (Years),Expected Salary,Status,Submitted At\n';
    
    for (const app of applications) {
      const dobStr = app.dateOfBirth.toISOString().split('T')[0];
      const submittedStr = app.createdAt.toISOString().split('T')[0];
      const decryptedAadhaar = decryptAadhaar(app.aadhaarEnc);

      // Escape quotes/commas for standard CSV format
      const escapedName = `"${app.fullName.replace(/"/g, '""')}"`;
      const escapedAddress = `"${app.address.replace(/"/g, '""')}"`;

      csvContent += `${app.id},${escapedName},${app.mobile},${app.email},${app.gender},${dobStr},'${decryptedAadhaar},${app.position},${app.experience},${app.expectedSalary},${app.status},${submittedStr}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sucihome_applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export failed:', error);
    return res.status(500).json({ error: 'Server error exporting CSV' });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Something broke on the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`SuciHome Express Backend server running!`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});
