import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import LoginHistory from '../models/LoginHistory.js';
import { protect } from '../middleware/auth.js';
import { sendEmail, getChromeOtpTemplate, getForgotPasswordTemplate } from '../services/emailService.js';
import deviceDetector from '../middleware/deviceDetector.js';

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate alphabetical-only password
const generateAlphabeticalPassword = (length = 10) => {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    password += letters.charAt(randomIndex);
  }
  return password;
};

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret_for_dev_mode',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or phone number' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'student',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Login user & check Chrome OTP rule
// @route   POST /api/auth/login
// @access  Public
router.post('/login', deviceDetector, async (req, res) => {
  const { email, password } = req.body;
  const { browser, os, deviceType, ipAddress } = req.deviceDetails;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check CHROME BROWSER RULE:
    // If logging in from Google Chrome, trigger OTP verification flow
    if (browser.toLowerCase().includes('chrome')) {
      const otp = generateOTP();
      
      // Store OTP in database
      await OTPVerification.create({
        email: user.email,
        otp,
        purpose: 'chrome_login',
      });

      // Send OTP to registered email
      const template = getChromeOtpTemplate(otp);
      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });

      return res.json({
        status: 'OTP_PENDING',
        email: user.email,
        purpose: 'chrome_login',
        message: 'Google Chrome login detected. For safety, a 6-digit OTP verification code has been dispatched to your email.',
      });
    }

    // Standard Browser login (e.g. Firefox, Safari)
    // Write to LoginHistory
    await LoginHistory.create({
      user: user._id,
      browser,
      os,
      deviceType,
      ipAddress,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      activePlan: user.activePlan,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify OTP for Chrome browser logins
// @route   POST /api/auth/verify-chrome-otp
// @access  Public
router.post('/verify-chrome-otp', deviceDetector, async (req, res) => {
  const { email, otp } = req.body;
  const { browser, os, deviceType, ipAddress } = req.deviceDetails;

  try {
    // Find valid OTP record
    const otpRecord = await OTPVerification.findOne({
      email,
      otp,
      purpose: 'chrome_login',
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired security code (OTP)' });
    }

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Delete used OTP
    await OTPVerification.findByIdAndDelete(otpRecord._id);

    // Save Login Session Audit
    await LoginHistory.create({
      user: user._id,
      browser,
      os,
      deviceType,
      ipAddress,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      activePlan: user.activePlan,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Chrome OTP Verification Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Forgot password with Email/Phone and secure alphabetical generator
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { identifier } = req.body; // Can be either email or phone number

  try {
    // Locate the user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found with this email/phone number' });
    }

    // Check FORGOT PASSWORD RULE:
    // Only once per day limit check
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (user.lastPasswordResetRequest) {
      const timeElapsed = now - new Date(user.lastPasswordResetRequest).getTime();
      if (timeElapsed < oneDayMs) {
        return res.status(429).json({
          message: 'You can use this option only once per day.',
          errorType: 'RESET_LIMIT_EXCEEDED'
        });
      }
    }

    // Generate random alphabetical-only password
    const rawNewPassword = generateAlphabeticalPassword(10);

    // Hash the password for database
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(rawNewPassword, salt);
    
    // Save request date
    user.lastPasswordResetRequest = new Date();
    await user.save();

    // Dispatch password email securely
    const template = getForgotPasswordTemplate(rawNewPassword);
    const emailResult = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.json({
      success: true,
      message: 'A new secure password has been generated and sent to your registered email address.',
      previewUrl: emailResult.previewUrl || null, // Ethereal link for local test testing
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile data
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (error) {
    console.error('Profile Error:', error.message);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @desc    Get user login activity logs
// @route   GET /api/auth/login-history
// @access  Private
router.get('/login-history', protect, async (req, res) => {
  try {
    const history = await LoginHistory.find({ user: req.user._id }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    console.error('Login History Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
