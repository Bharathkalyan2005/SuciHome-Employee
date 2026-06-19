import dotenv from 'dotenv';
import prisma from '../db/prisma';

dotenv.config();

// Standard Twilio Client configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// Resend Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const HR_WHATSAPP_NUMBER = process.env.HR_WHATSAPP_NUMBER || '+919392420643';
const HR_EMAIL = process.env.HR_EMAIL || 'Welcome@vrcpvtltd.com';

interface NotificationParams {
  applicationId: string;
  fullName: string;
  mobile: string;
  email: string;
  position: string;
  experience: number;
  expectedSalary: number;
}

/**
 * Send registration success notifications (WhatsApp & Email) to Applicant and HR Alert
 */
export async function sendRegistrationNotifications(params: NotificationParams) {
  const applicantMsg = `Hello ${params.fullName}, thank you for registering with SuciHome (VRC Pvt Ltd) for the ${params.position} role. Your Application ID is ${params.applicationId}. You can track your application status at: http://localhost:5173/status?id=${params.applicationId}`;
  
  const hrMsg = `Alert: A new employee application has been submitted by ${params.fullName} for the ${params.position} position.\nApplication ID: ${params.applicationId}\nExperience: ${params.experience} years\nExpected Salary: ₹${params.expectedSalary}\nView dashboard at: http://localhost:5173/admin`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #F5F0E8;">
      <h2 style="color: #1B4332; text-align: center;">SuciHome Employee Registration</h2>
      <hr style="border: 0; border-top: 1px solid #C9A84C;" />
      <p style="color: #2D4A35; font-size: 16px;">Dear <strong>${params.fullName}</strong>,</p>
      <p style="color: #2D4A35; font-size: 14px; line-height: 1.5;">
        Thank you for submitting your application to SuciHome - India's leading home cleaning company. We are excited about the prospect of having you join our team.
      </p>
      <div style="background-color: #1B4332; color: #FFFFFF; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Application ID</p>
        <h3 style="margin: 5px 0 0 0; color: #C9A84C; font-size: 24px; letter-spacing: 2px;">${params.applicationId}</h3>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: #2D4A35;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Position Applied</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${params.position}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Mobile</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${params.mobile}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Status Link</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">
            <a href="http://localhost:5173/status?id=${params.applicationId}" style="color: #C9A84C; font-weight: bold; text-decoration: none;">Track Status</a>
          </td>
        </tr>
      </table>
      <p style="color: #2D4A35; font-size: 14px; margin-top: 20px; line-height: 1.5;">
        Our recruitment team (VRC Pvt Ltd) will review your credentials and contact you if you are shortlisted. If you have questions, please reach out to us at <strong>9392420643</strong> or <strong>Welcome@vrcpvtltd.com</strong>.
      </p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 25px 0 15px 0;" />
      <p style="color: #7A9E82; font-size: 11px; text-align: center; margin: 0;">
        &copy; 2026 SuciHome / VRC Pvt Ltd. All rights reserved.
      </p>
    </div>
  `;

  // 1. Send WhatsApp to Applicant
  await sendWhatsApp(params.mobile, applicantMsg, 'Applicant');

  // 2. Send WhatsApp to HR
  await sendWhatsApp(HR_WHATSAPP_NUMBER, hrMsg, 'HR');

  // 3. Send Email to Applicant
  await sendEmail(params.email, 'SuciHome Application Confirmation', emailHtml);
}

/**
 * Helper to send WhatsApp message via Twilio (or fallback to log)
 */
export async function sendWhatsApp(to: string, body: string, recipientRole: string): Promise<boolean> {
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : `+91${to}`}`;
  
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
      // Dynamic import of Twilio helper to prevent crash if not configured
      const twilio = require('twilio');
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: formattedTo,
        body: body
      });
      console.log(`[Twilio WhatsApp] Success sending message to ${recipientRole} (${formattedTo})`);
      return true;
    } catch (error) {
      console.error(`[Twilio WhatsApp] Error sending to ${formattedTo}:`, error);
    }
  }

  // Fallback logging for local testing
  console.log(`
=========================================
[MOCK WHATSAPP NOTIFICATION to ${recipientRole}]
To: ${formattedTo}
From: ${TWILIO_WHATSAPP_FROM}
Message:
${body}
=========================================
  `);
  return true;
}

/**
 * Helper to send Email via Resend API (or fallback to log)
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'SuciHome Portal <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html
        })
      });
      if (response.ok) {
        console.log(`[Resend Email] Success sending email to ${to}`);
        return true;
      } else {
        const errData = await response.json();
        console.error(`[Resend Email] API Error:`, errData);
      }
    } catch (error) {
      console.error(`[Resend Email] Error sending email to ${to}:`, error);
    }
  }

  // Fallback logging for local testing
  console.log(`
=========================================
[MOCK EMAIL NOTIFICATION]
To: ${to}
Subject: ${subject}
Content: (Visual Email template logged to terminal)
=========================================
  `);
  return true;
}

/**
 * On payout request submitted, alert HR
 */
export async function alertHRPayoutRequest(request: any) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: request.employeeId },
      select: { fullName: true }
    });
    const name = employee?.fullName || 'Unknown';
    const fromDateStr = new Date(request.fromDate).toLocaleDateString();
    const toDateStr = new Date(request.toDate).toLocaleDateString();
    
    const body = `💰 New Payout Request — SuciHome

Employee : ${name}
Amount   : ₹${request.amount}
Period   : ${fromDateStr} to ${toDateStr}
Method   : ${request.method}
Request ID: ${request.requestId}

Review at: suci-home-employee.vercel.app/admin`;

    await sendWhatsApp(HR_WHATSAPP_NUMBER, body, 'HR');
  } catch (error) {
    console.error('[Notification Error] Failed to alert HR of payout request:', error);
  }
}

/**
 * On payout marked PAID, confirm to employee
 */
export async function sendPayoutConfirmation(request: any) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: request.employeeId },
      select: { fullName: true, mobile: true }
    });
    if (!employee) return;
    
    const paidAtStr = new Date(request.paidAt || new Date()).toLocaleDateString();
    const paidViaStr = request.paidVia || 'N/A';
    
    const body = `Hi ${employee.fullName}! ✅ Your payout has been processed!

Amount : ₹${request.amount}
Method : ${request.method}
Date   : ${paidAtStr}
Ref    : ${paidViaStr}

Thank you for your hard work! 
— SuciHome HR Team ✦`;

    await sendWhatsApp(employee.mobile, body, 'Applicant');
  } catch (error) {
    console.error('[Notification Error] Failed to send payout confirmation to employee:', error);
  }
}
