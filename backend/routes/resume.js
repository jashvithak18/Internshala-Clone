import express from 'express';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import Payment from '../models/Payment.js';
import Resume from '../models/Resume.js';
import { protect } from '../middleware/auth.js';
import paymentGuard from '../middleware/paymentGuard.js';
import { sendEmail, getResumeOtpTemplate, getPaymentInvoiceTemplate } from '../services/emailService.js';

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate unique codes
const generateInvoiceNumber = () => {
  return 'INV-RES-' + Math.floor(100000 + Math.random() * 900000).toString();
};

const generatePaymentId = () => {
  return 'pay_res_' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// @desc    Step 1: Request OTP before resume generation payment
// @route   POST /api/resume/send-otp
// @access  Private
router.post('/send-otp', protect, async (req, res) => {
  const user = req.user;

  try {
    // Resume is a premium feature, let's verify premium status
    if (!user.isPremium) {
      return res.status(403).json({
        message: 'The Resume Builder is a premium feature. Please purchase a Bronze, Silver, or Gold subscription plan to unlock it.',
        errorType: 'NOT_PREMIUM'
      });
    }

    const otp = generateOTP();

    // Store OTP in database
    await OTPVerification.create({
      email: user.email,
      otp,
      purpose: 'resume_payment',
    });

    // Send email with dynamic resume OTP template
    const template = getResumeOtpTemplate(otp);
    const emailResult = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.json({
      success: true,
      message: 'Security OTP verification code sent to your email address.',
      previewUrl: emailResult.previewUrl || null, // local testing helper
    });
  } catch (error) {
    console.error('Send Resume OTP Error:', error.message);
    res.status(500).json({ message: 'Server error sending verification OTP' });
  }
});

// @desc    Step 2: Verify OTP for resume generation payment
// @route   POST /api/resume/verify-otp
// @access  Private
router.post('/verify-otp', protect, async (req, res) => {
  const { otp } = req.body;
  const user = req.user;

  try {
    if (!otp) {
      return res.status(400).json({ message: 'OTP code is required' });
    }

    // Find valid OTP record
    const otpRecord = await OTPVerification.findOne({
      email: user.email,
      otp,
      purpose: 'resume_payment',
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Mark OTP as verified in the DB instead of deleting it immediately, 
    // so the subsequent payment route can verify it!
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'OTP verified successfully! You may now proceed to the ₹50 resume generation payment.',
    });
  } catch (error) {
    console.error('Verify Resume OTP Error:', error.message);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
});

// @desc    Step 3: Process ₹50 payment for Resume builder (Requires verified OTP & Payment IST hour)
// @route   POST /api/resume/pay
// @access  Private
router.post('/pay', protect, paymentGuard, async (req, res) => {
  const user = req.user;

  try {
    // 1. Confirm that a verified OTP exists for this email
    const otpRecord = await OTPVerification.findOne({
      email: user.email,
      purpose: 'resume_payment',
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Security OTP verification has not been completed yet. Please verify OTP first.',
        errorType: 'OTP_NOT_VERIFIED'
      });
    }

    // 2. Process mock payment of ₹50
    const paymentId = generatePaymentId();
    const invoiceNumber = generateInvoiceNumber();
    const amount = 50;

    // Create billing log
    const payment = await Payment.create({
      user: user._id,
      paymentId,
      planName: 'Premium Resume Builder',
      amount,
      invoiceNumber,
    });

    // Clean up verified OTP record
    await OTPVerification.findByIdAndDelete(otpRecord._id);

    // Send payment invoice email
    const invoiceDetails = {
      planName: 'Premium Resume Builder Charge',
      amount,
      paymentId,
      invoiceNumber,
      date: new Date().toDateString(),
    };

    const template = getPaymentInvoiceTemplate(invoiceDetails);
    const emailResult = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.json({
      success: true,
      message: 'Payment of ₹50 successfully processed! Resume Builder workspace unlocked.',
      payment,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    console.error('Resume Payment Error:', error.message);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// @desc    Step 4: Create and save professional resume to profile
// @route   POST /api/resume/generate
// @access  Private
router.post('/generate', protect, async (req, res) => {
  const { name, qualifications, experience, skills, personalDetails, profilePhoto } = req.body;
  const userId = req.user._id;

  try {
    if (!name || !personalDetails) {
      return res.status(400).json({ message: 'Name and personal details are required to generate a resume' });
    }

    // Verify user has paid for the resume builder at least once, or has premium subscription logs
    const paymentExists = await Payment.findOne({
      user: userId,
      planName: 'Premium Resume Builder',
      status: 'success'
    });

    if (!paymentExists) {
      return res.status(403).json({
        message: 'No resume payment logs found for your account. Please complete the security OTP and ₹50 payment flow to activate this feature.',
        errorType: 'PAYMENT_MISSING'
      });
    }

    // Create or update resume (only one active premium resume template stored per user is standard, or multiple)
    // Let's do an upsert: update if exists, else create new!
    let resume = await Resume.findOne({ user: userId });

    if (resume) {
      resume.name = name;
      resume.qualifications = qualifications;
      resume.experience = experience;
      resume.skills = skills;
      resume.personalDetails = personalDetails;
      resume.profilePhoto = profilePhoto || resume.profilePhoto;
      await resume.save();
    } else {
      resume = await Resume.create({
        user: userId,
        name,
        qualifications,
        experience,
        skills,
        personalDetails,
        profilePhoto: profilePhoto || '',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Premium resume generated and saved to your profile!',
      resume,
    });
  } catch (error) {
    console.error('Generate Resume Error:', error.message);
    res.status(500).json({ message: 'Server error generating resume' });
  }
});

// @desc    Get user's saved resume
// @route   GET /api/resume/my-resume
// @access  Private
router.get('/my-resume', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'No resume template found. Create one now!' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Fetch Resume Error:', error.message);
    res.status(500).json({ message: 'Server error fetching resume' });
  }
});

export default router;
