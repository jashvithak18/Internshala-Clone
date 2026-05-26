import express from 'express';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import { protect } from '../middleware/auth.js';
import { sendEmail, getLanguageOtpTemplate } from '../services/emailService.js';

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Switch user language preference (Handles French OTP rule)
// @route   POST /api/language/switch
// @access  Private
router.post('/switch', protect, async (req, res) => {
  const { language, otp } = req.body;
  const userId = req.user._id;
  const supportedLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

  try {
    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({ message: 'Invalid or unsupported language code' });
    }

    const user = await User.findById(userId);

    // FRENCH LANGUAGE SECURITY RULE
    // If switching to French, demand OTP validation
    if (language === 'fr') {
      if (!otp) {
        // Trigger OTP generation and email dispatch
        const generatedOtp = generateOTP();

        // Save OTP record
        await OTPVerification.create({
          email: user.email,
          otp: generatedOtp,
          purpose: 'french_language',
        });

        // Send OTP email with custom French layout
        const template = getLanguageOtpTemplate(generatedOtp);
        const emailResult = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        return res.json({
          status: 'OTP_PENDING',
          language: 'fr',
          message: 'Changing your language to French requires a security verification. We have dispatched a 6-digit OTP code to your registered email.',
          previewUrl: emailResult.previewUrl || null,
        });
      } else {
        // OTP is provided, let's verify it!
        const otpRecord = await OTPVerification.findOne({
          email: user.email,
          otp,
          purpose: 'french_language',
        });

        if (!otpRecord) {
          return res.status(400).json({ message: 'Invalid or expired French verification code (OTP)' });
        }

        // Clean up OTP
        await OTPVerification.findByIdAndDelete(otpRecord._id);

        // Apply French language setting
        user.language = 'fr';
        await user.save();

        return res.json({
          success: true,
          message: 'Language switched to French successfully!',
          language: 'fr',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            language: user.language,
          }
        });
      }
    }

    // Standard Language switch (English, Spanish, Hindi, Portuguese, Chinese)
    // Applies immediately without OTP verification
    user.language = language;
    await user.save();

    res.json({
      success: true,
      message: `Language preference successfully updated to '${language}'`,
      language: user.language,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
      }
    });

  } catch (error) {
    console.error('Language Switch Error:', error.message);
    res.status(500).json({ message: 'Server error switching language setting' });
  }
});

export default router;
