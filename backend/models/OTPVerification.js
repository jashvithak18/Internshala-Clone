import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['chrome_login', 'french_language', 'resume_payment'],
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Automatic deletion after 5 minutes (300 seconds)
  }
});

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
