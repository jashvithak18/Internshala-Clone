import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  qualifications: [{
    school: String,
    degree: String,
    year: String,
  }],
  experience: [{
    company: String,
    role: String,
    duration: String,
    description: String,
  }],
  skills: [{
    type: String,
  }],
  personalDetails: {
    email: String,
    phone: String,
    address: String,
    summary: String,
  },
  profilePhoto: {
    type: String, // URL or base64 data string
  }
}, {
  timestamps: true,
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
