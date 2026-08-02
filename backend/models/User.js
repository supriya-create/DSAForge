const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      // Allow common email characters such as +, dots and hyphens. Not full RFC but practical.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password should be at least 8 characters'],
      select: false
    },
    avatar: {
      type: String,
      default: null
    },
    // LEGACY FIELD: kept only for backward compatibility with old documents.
    // The canonical field is `leetcodeUsername`. Use that in all new code.
    leetcode: {
      type: String,
      default: null
    },
    leetcodeUsername: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    githubUsername: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    codeforcesUsername: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    college: {
      type: String,
      default: null
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate'],
      default: null
    },
    phone: {
      type: String,
      default: null
    },
    refreshTokens: [{
      token: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // 7 days
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  return user;
};

module.exports = mongoose.model('User', userSchema);
