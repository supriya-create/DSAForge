const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { LeetcodeStats } = require('../models');
const { syncLeetCodeProfile } = require('../services/leetcodeService');
const { validationResult } = require('express-validator');
const { validateEmailIsReal } = require('../services/emailValidator');
const { OAuth2Client } = require('google-auth-library');

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const buildLeetCodePayload = (stats) => {
  if (!stats) return null;

  return {
    username: stats.username,
    summary: {
      totalSolved: stats.totalSolved,
      easySolved: stats.easySolved,
      mediumSolved: stats.mediumSolved,
      hardSolved: stats.hardSolved,
      ranking: stats.ranking,
    },
    contestRating: stats.contestRating,
    contestHistory: stats.contestHistory || [],
    recentSubmissions: stats.recentSubmissions || [],
    badges: stats.badges || [],
    languageStats: stats.languageStats || [],
    lastSynced: stats.lastSynced,
  };
};

// Generate JWT Token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'dev-default-jwt-secret-change-me';
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Using a development fallback secret. Do not use in production.');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, college, year } = req.body;

    // Verify email is a real address with valid domain & MX records
    const isEmailReal = await validateEmailIsReal(email);
    if (!isEmailReal) {
      return res.status(400).json({
        success: false,
        message: 'The email address domain is invalid, inactive, or disposable. Please use a real email ID.'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      college,
      year,
      avatar: name ? name[0].toUpperCase() : 'U'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    // Handle mongoose validation errors gracefully
    if (error && error.name === 'ValidationError') {
      const details = Object.keys(error.errors).map(k => ({ field: k, message: error.errors[k].message }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const cachedStats = await LeetcodeStats.findOne({ userId: user._id }).lean();
    const username = user.leetcodeUsername || user.leetcode || null;
    const shouldSync = !cachedStats || !cachedStats.lastSynced || (Date.now() - new Date(cachedStats.lastSynced).getTime()) > TWENTY_FOUR_HOURS;

    if (shouldSync && username) {
      void (async () => {
        try {
          await syncLeetCodeProfile({ userId: user._id, username });
        } catch (error) {
          console.error('Background LeetCode sync failed during login:', error.message);
        }
      })();
    }

    // Generate token
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
      leetcodeData: buildLeetCodePayload(cachedStats),
      leetcodeSyncTriggered: Boolean(shouldSync && username)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, leetcode, college, year, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        ...(name && { name }),
        ...(leetcode && { leetcode }),
        ...(college && { college }),
        ...(year && { year }),
        ...(phone && { phone })
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: error.message
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};

// Verify Token
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error verifying token',
      error: error.message
    });
  }
};

// Google Sign-In / Login
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID Token is required'
      });
    }

    // Verify Google ID Token
    // We try to verify using process.env.GOOGLE_CLIENT_ID
    // If not configured, we fallback to a default client ID for local testing.
    const clientId = process.env.GOOGLE_CLIENT_ID || '679460937668-ic577i6t2f1gmu5vj9ga2kl3ka3v917g.apps.googleusercontent.com';
    const localClient = new OAuth2Client(clientId);
    
    let payload;
    try {
      const ticket = await localClient.verifyIdToken({
        idToken,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google ID Token',
        error: verifyError.message
      });
    }

    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google email is not verified'
      });
    }

    // Find user by email
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate a secure random password since schema requires password
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      // Create user
      user = new User({
        name,
        email,
        password: randomPassword,
        avatar: picture || (name ? name[0].toUpperCase() : 'G'),
        leetcode: null,
        college: null,
        year: null
      });

      await user.save();
    } else {
      // User exists, update lastLogin and potentially avatar if it was null
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token for session
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const cachedStats = await LeetcodeStats.findOne({ userId: user._id }).lean();
    const username = user.leetcodeUsername || user.leetcode || null;
    const shouldSync = !cachedStats || !cachedStats.lastSynced || (Date.now() - new Date(cachedStats.lastSynced).getTime()) > TWENTY_FOUR_HOURS;

    if (shouldSync && username) {
      void (async () => {
        try {
          await syncLeetCodeProfile({ userId: user._id, username });
        } catch (error) {
          console.error('Background LeetCode sync failed during Google login:', error.message);
        }
      })();
    }

    res.status(200).json({
      success: true,
      message: isNewUser ? 'User registered and logged in via Google successfully' : 'Login successful via Google',
      token,
      user: user.toJSON(),
      leetcodeData: buildLeetCodePayload(cachedStats),
      leetcodeSyncTriggered: Boolean(shouldSync && username)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: error.message
    });
  }
};
