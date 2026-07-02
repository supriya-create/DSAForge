const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { LeetcodeStats } = require('../models');
const { syncLeetCodeProfile } = require('../services/leetcodeService');
const { validationResult } = require('express-validator');

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
