import nodemailer from 'nodemailer';

// Create standard transporter
// In production, configure SMTP host, port, user, pass in .env
let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  const hasEnvVars = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasEnvVars) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback: Use Ethereal test email account
    console.log('--- SMTP Env variables not fully configured. Creating a mock Ethereal SMTP server ---');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Mock Ethereal Mail Transporter Active! User: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal SMTP server, falling back to mock logger:', err.message);
      // Absolute fallback: mock transporter
      transporter = {
        sendMail: async (options) => {
          console.log(`[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`);
          console.log(`[BODY]:\n${options.text || options.html}`);
          return { messageId: 'mock-id-' + Math.random(), previewUrl: 'https://ethereal.email' };
        }
      };
    }
  }

  return transporter;
};

// Main function to send mail
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailClient = await createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Elevance Internshala Security" <security@elevance-internshala.com>',
      to,
      subject,
      text: text || 'This is an automated system email.',
      html,
    };

    const info = await mailClient.sendMail(mailOptions);
    console.log(`Email dispatched successfully to ${to}. Message ID: ${info.messageId}`);
    
    // Log preview URL if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[ETHEREAL PREVIEW URL]: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email dispatch failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// --- Custom Templates ---

export const getChromeOtpTemplate = (otp) => {
  return {
    subject: '⚠️ Security Verification Code - Chrome Login Attempt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Chrome Security Verification</h2>
        <p>Hello,</p>
        <p>We detected a login attempt using a <strong>Google Chrome</strong> browser on your account.</p>
        <p>As per your security rules, please enter the following 6-digit One-Time Password (OTP) to authorize and complete this login:</p>
        <div style="background-color: #f3f4f6; text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 6px; color: #1e1b4b;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 14px;">This code is valid for 5 minutes. If you did not make this request, please change your password immediately.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Elevance Skills Internshala Security Systems</p>
      </div>
    `
  };
};

export const getForgotPasswordTemplate = (newPassword) => {
  return {
    subject: '🔑 Your New Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Password Successfully Reset</h2>
        <p>Hello,</p>
        <p>We have processed your request for a password reset. A new secure password has been generated for your account:</p>
        <div style="background-color: #eef2ff; border-left: 4px solid #4f46e5; padding: 15px; font-size: 20px; font-family: monospace; font-weight: bold; margin: 20px 0; text-align: center; color: #1e1b4b;">
          ${newPassword}
        </div>
        <p>You can now log in using this password. Once logged in, you can go to your settings to update your password if desired.</p>
        <p style="color: #e11d48; font-weight: bold;">Security Notice: This password contains uppercase and lowercase letters only for strict standards compatibility.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Elevance Skills Internshala Systems</p>
      </div>
    `
  };
};

export const getPaymentInvoiceTemplate = (invoiceDetails) => {
  const { planName, amount, paymentId, invoiceNumber, date } = invoiceDetails;
  return {
    subject: `📄 Invoice ${invoiceNumber} - Subscription Purchased Successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0;">Elevance Internshala</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">Official Receipt & Invoice</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Invoice Number:</strong></td>
            <td style="padding: 5px 0; text-align: right;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Payment ID:</strong></td>
            <td style="padding: 5px 0; text-align: right;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Date:</strong></td>
            <td style="padding: 5px 0; text-align: right;">${date}</td>
          </tr>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px 0; text-align: left; color: #475569;">Description</th>
              <th style="padding: 10px 0; text-align: right; color: #475569;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 15px 0;"><strong>${planName}</strong><br/><span style="font-size: 12px; color: #64748b;">Monthly premium access subscription</span></td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold;">₹${amount}.00</td>
            </tr>
            <tr>
              <td style="padding: 15px 0; font-weight: bold; font-size: 16px;">Total Paid:</td>
              <td style="padding: 15px 0; text-align: right; font-weight: bold; font-size: 18px; color: #4f46e5;">₹${amount}.00</td>
            </tr>
          </tbody>
        </table>
        
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 15px; font-size: 13px; color: #475569; margin: 20px 0; border: 1px dashed #cbd5e1;">
          <strong>Payment Note:</strong> This payment was successfully verified and processed during our official payment IST hour (10:00 AM - 11:00 AM IST).
        </div>
        
        <p style="text-align: center; color: #64748b; font-size: 14px;">Thank you for choosing Elevance Skills Internshala!</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Elevance Skills Internshala Billing Operations</p>
      </div>
    `
  };
};

export const getResumeOtpTemplate = (otp) => {
  return {
    subject: '🛡️ OTP Verification - Premium Resume Builder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Resume Builder Security OTP</h2>
        <p>Hello,</p>
        <p>You requested a premium Resume Builder generation. The generation charge is <strong>₹50 per resume</strong>.</p>
        <p>Before proceeding with payment, please enter this security OTP verification code:</p>
        <div style="background-color: #f5f3ff; text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 6px; color: #4338ca; border: 1px solid #ddd6fe;">
          ${otp}
        </div>
        <p>Once you verify this code, you will be redirected to the secure ₹50 payment gateway. This OTP is valid for 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Elevance Skills Internshala Resume Services</p>
      </div>
    `
  };
};

export const getLanguageOtpTemplate = (otp) => {
  return {
    subject: '🇫🇷 Language Protection - French Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Security Verification Code</h2>
        <p>Bonjour,</p>
        <p>We detected an instruction to switch your platform language setting to <strong>French (Français)</strong>.</p>
        <p>To secure your preferences against unauthorized changes, please verify this setting change by entering the following code:</p>
        <div style="background-color: #f8fafc; text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 6px; color: #1e3a8a; border: 1px solid #cbd5e1;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 14px;">If you did not initiate this language setting change, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">Elevance Skills Internshala Language Services</p>
      </div>
    `
  };
};
