// models/User.js - User model for SecureX Industries
// Developed by nxtlap

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'supervisor', 'worker'],
      message: '{VALUE} is not a valid role'
    },
    default: 'worker'
  },
  accessLevel: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  department: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  apiKey: String,
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// Password encryption middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
UserSchema.methods.generateResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

// Generate API key
UserSchema.methods.generateApiKey = function() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  this.apiKey = apiKey;
  return apiKey;
};

// Add login attempt tracking for security
UserSchema.methods.recordLoginAttempt = function() {
  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    // Lock account for 30 minutes after 5 failed attempts
    this.lockedUntil = Date.now() + 30 * 60 * 1000;
  }

  return this.save();
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockedUntil = undefined;
  return this.save();
};

// Check if account is locked
UserSchema.methods.isAccountLocked = function() {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Create an index for email and username to speed up queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

module.exports = mongoose.model('User', UserSchema);
