import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'employer', 'admin'],
    default: 'student',
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
  },
  activePlan: {
    planName: {
      type: String,
      default: 'Free Plan',
      enum: ['Free Plan', 'Bronze Plan', 'Silver Plan', 'Gold Plan'],
    },
    applicationsUsedThisMonth: {
      type: Number,
      default: 0,
    },
    maxApplications: {
      type: Number,
      default: 1, // Free: 1, Bronze: 3, Silver: 5, Gold: 9999 (unlimited)
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    }
  },
  postsCountToday: {
    type: Number,
    default: 0,
  },
  lastPostReset: {
    type: Date,
    default: Date.now,
  },
  lastPasswordResetRequest: {
    type: Date,
  },
  isPremium: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
export default User;
