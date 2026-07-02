const { AppError, getStoredLeetCodeProfile, syncLeetCodeProfile } = require('../services/leetcodeService');

const getLeetCodeProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const leetcodeData = await getStoredLeetCodeProfile({ userId });

    res.status(200).json({
      success: true,
      leetcodeData,
    });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error.message || 'Server error retrieving LeetCode data';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.details || null,
    });
  }
};

const syncLeetCodeProfileHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { username } = req.body;

    const result = await syncLeetCodeProfile({ userId, username });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error.message || 'Server error syncing LeetCode data';

    res.status(statusCode).json({
      success: false,
      message,
      error: error.details || null,
    });
  }
};

module.exports = {
  getLeetCodeProfile,
  syncLeetCodeProfileHandler,
};
