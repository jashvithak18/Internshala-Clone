import express from 'express';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import paymentGuard from '../middleware/paymentGuard.js';
import { sendEmail, getPaymentInvoiceTemplate } from '../services/emailService.js';

const router = express.Router();

// Helper to generate Invoice ID and Payment ID
const generateInvoiceNumber = () => {
  return 'INV-' + Math.floor(100000 + Math.random() * 900000).toString();
};

const generatePaymentId = () => {
  return 'pay_' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Plan details mapper
const plans = {
  'Bronze Plan': { price: 100, maxApplications: 3 },
  'Silver Plan': { price: 300, maxApplications: 5 },
  'Gold Plan': { price: 1000, maxApplications: 9999 }, // 9999 represents unlimited
};

// @desc    Process a subscription plan purchase
// @route   POST /api/payments/subscribe
// @access  Private
router.post('/subscribe', protect, paymentGuard, async (req, res) => {
  const { planName } = req.body;
  const userId = req.user._id;

  try {
    if (!planName || !plans[planName]) {
      return res.status(400).json({ message: 'Invalid or missing plan name selection' });
    }

    const selectedPlan = plans[planName];
    const amount = selectedPlan.price;
    const paymentId = generatePaymentId();
    const invoiceNumber = generateInvoiceNumber();
    const date = new Date().toDateString();

    // 1. Log transaction in Payment Collection
    const payment = await Payment.create({
      user: userId,
      paymentId,
      planName,
      amount,
      invoiceNumber,
    });

    // 2. Update user's active plan
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const user = await User.findById(userId);
    user.activePlan = {
      planName,
      applicationsUsedThisMonth: 0,
      maxApplications: selectedPlan.maxApplications,
      expiresAt,
    };
    user.isPremium = true;
    await user.save();

    // 3. Send successful payment invoice email
    const invoiceDetails = {
      planName,
      amount,
      paymentId,
      invoiceNumber,
      date,
    };

    const template = getPaymentInvoiceTemplate(invoiceDetails);
    const emailResult = await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    // 4. Create Notification
    const notification = await Notification.create({
      user: userId,
      type: 'system',
      message: `Successfully subscribed to ${planName}! Invoice ${invoiceNumber} has been dispatched to your email address.`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('new_notification', notification);
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan processed successfully',
      payment,
      activePlan: user.activePlan,
      isPremium: user.isPremium,
      previewUrl: emailResult.previewUrl || null, // For Ethereal local testing links
    });
  } catch (error) {
    console.error('Subscription Payment Error:', error.message);
    res.status(500).json({ message: 'Server error processing transaction' });
  }
});

// @desc    Retrieve payment history of current user
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const history = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('Payment History Fetch Error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
