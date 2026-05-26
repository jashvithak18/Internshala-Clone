import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true, // Free/Bronze/Silver/Gold Plan or 'Premium Resume Builder'
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  }
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
