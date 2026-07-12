import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const AppContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL || '';

const DEFAULT_TOPICS = [
  { topic: 'Arrays', solved: 35, easy: 20, medium: 12, hard: 3, total: 80 },
  { topic: 'Strings', solved: 28, easy: 15, medium: 10, hard: 3, total: 60 },
  { topic: 'Linked Lists', solved: 18, easy: 10, medium: 6, hard: 2, total: 40 },
  { topic: 'Trees', solved: 10, easy: 5, medium: 4, hard: 1, total: 50 },
  { topic: 'Graphs', solved: 4, easy: 2, medium: 2, hard: 0, total: 55 },
  { topic: 'Dynamic Programming', solved: 6, easy: 3, medium: 2, hard: 1, total: 70 },
  { topic: 'Heaps', solved: 8, easy: 4, medium: 3, hard: 1, total: 30 },
  { topic: 'Sorting', solved: 22, easy: 12, medium: 8, hard: 2, total: 35 },
  { topic: 'Binary Search', solved: 14, easy: 8, medium: 5, hard: 1, total: 40 },
  { topic: 'Recursion', solved: 12, easy: 7, medium: 4, hard: 1, total: 35 },
];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);

  const [dsaProgress, setDsaProgress] = useState(DEFAULT_TOPICS);

  const [streak, setStreak] = useState(7);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leetcodeData, setLeetCodeData] = useState(null);
  const [leetcodeLoading, setLeetCodeLoading] = useState(false);
  const [leetcodeError, setLeetCodeError] = useState(null);

  const setToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    setAuthToken(token);
  };

  const login = (userData, leetcodeDataFromAuth = null) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (leetcodeDataFromAuth) {
      setLeetCodeData(leetcodeDataFromAuth);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setDsaProgress(DEFAULT_TOPICS);
    setStreak(7);
    setLeetCodeData(null);
    setActiveTab('dashboard');
  };

  const request = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  };

  const registerUser = async ({ name, email, password }) => {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setToken(data.token);
    login(data.user, data.leetcodeData || null);
    return data;
  };

  const loginUser = async ({ email, password }) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    login(data.user, data.leetcodeData || null);
    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (data?.success && data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const runAIAnalysis = async (progress) => {
    return await request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  };

  const solveAIDoubt = async (code, question) => {
    return await request('/api/ai/doubt-solve', {
      method: 'POST',
      body: JSON.stringify({ code, question })
    });
  };

  const generateAIRoadmap = async (progress, weeks) => {
    return await request('/api/ai/roadmap', {
      method: 'POST',
      body: JSON.stringify({ progress, weeks })
    });
  };

  const fetchLatestAIAnalysis = async () => {
    return await request('/api/ai/analyze', { method: 'GET' });
  };

  const fetchDoubtHistory = async () => {
    return await request('/api/ai/doubt-history', { method: 'GET' });
  };

  const fetchLatestRoadmap = async () => {
    return await request('/api/ai/roadmap', { method: 'GET' });
  };

  const generateMockOA = async (company, difficulty, topics) => {
    return await request('/api/ai/mock-oa', {
      method: 'POST',
      body: JSON.stringify({ company, difficulty, topics })
    });
  };

  const fetchLatestMockOA = async () => {
    return await request('/api/ai/mock-oa', { method: 'GET' });
  };

  const generateProblems = async (platform, weakTopics) => {
    return await request('/api/ai/problems', {
      method: 'POST',
      body: JSON.stringify({ platform, weakTopics })
    });
  };

  const fetchLatestProblems = async () => {
    return await request('/api/ai/problems', { method: 'GET' });
  };

  const loadCurrentUser = async () => {
    if (!authToken) return;
    try {
      const data = await request('/api/auth/me', { method: 'GET' });
      login(data.user, null);
    } catch (err) {
      // Don't logout on error - user is already logged in via loginUser/registerUser
      // This endpoint might fail for various reasons but shouldn't undo the login
      console.warn('Unable to load current user profile:', err.message);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, [authToken]);

  useEffect(() => {
    const fetchTrackerData = async () => {
      if (isLoggedIn) {
        try {
          const data = await request('/api/tracker', { method: 'GET' });
          if (data && data.success) {
            setDsaProgress(data.dsaProgress);
            setStreak(data.streak);
          }

          await loadLeetCodeData();
        } catch (err) {
          console.error('Error fetching tracker data:', err.message);
        }
      }
    };
    fetchTrackerData();
  }, [isLoggedIn]);

  const updateProgress = async (topic, updatedFields) => {
    const casted = {};
    for (const key of ['solved', 'easy', 'medium', 'hard', 'total']) {
      if (updatedFields[key] !== undefined) {
        casted[key] = parseInt(updatedFields[key]) || 0;
      }
    }

    setDsaProgress(prev =>
      prev.map(item =>
        item.topic === topic ? { ...item, ...casted } : item
      )
    );

    try {
      await request(`/api/tracker/progress/${encodeURIComponent(topic)}`, {
        method: 'PUT',
        body: JSON.stringify(casted)
      });
    } catch (err) {
      console.error('Error updating progress in backend:', err.message);
    }
  };

  const addTopic = async (newTopic) => {
    const casted = {
      topic: newTopic.topic,
      solved: parseInt(newTopic.solved) || 0,
      easy: parseInt(newTopic.easy) || 0,
      medium: parseInt(newTopic.medium) || 0,
      hard: parseInt(newTopic.hard) || 0,
      total: parseInt(newTopic.total) || 50
    };

    setDsaProgress(prev => [...prev, casted]);

    try {
      await request('/api/tracker/progress', {
        method: 'POST',
        body: JSON.stringify(casted)
      });
    } catch (err) {
      console.error('Error adding topic in backend:', err.message);
    }
  };

  const updateStreak = async (newStreak) => {
    const streakVal = parseInt(newStreak) || 0;
    setStreak(streakVal);

    if (isLoggedIn) {
      try {
        await request('/api/tracker/streak', {
          method: 'PUT',
          body: JSON.stringify({ streak: streakVal })
        });
      } catch (err) {
        console.error('Error updating streak in backend:', err.message);
      }
    }
  };

  const loadLeetCodeData = async () => {
    setLeetCodeLoading(true);
    setLeetCodeError(null);
    try {
      const data = await request('/api/leetcode', { method: 'GET' });
      if (data?.success) {
        setLeetCodeData(data.leetcodeData || null);
        return data.leetcodeData || null;
      }
      return null;
    } catch (err) {
      console.error('LeetCode load error', err);
      setLeetCodeError('Unable to load LeetCode data.');
      setLeetCodeData(null);
      return null;
    } finally {
      setLeetCodeLoading(false);
    }
  };

  const fetchLeetCodeData = async (username) => {
    if (!username) return null;
    setLeetCodeLoading(true);
    setLeetCodeError(null);
    try {
      const data = await request('/api/leetcode/sync', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      const userData = data?.leetcodeData || null;
      setLeetCodeData(userData);
      return userData;
    } catch (err) {
      console.error('LeetCode fetch error', err);
      setLeetCodeError('Unable to fetch LeetCode data.');
      setLeetCodeData(null);
      return null;
    } finally {
      setLeetCodeLoading(false);
    }
  };

  const computedDsaProgress = useMemo(() => {
    if (!leetcodeData || !leetcodeData.summary) {
      return dsaProgress;
    }

    const { easySolved, mediumSolved, hardSolved } = leetcodeData.summary;
    if (!easySolved && !mediumSolved && !hardSolved) {
      return dsaProgress;
    }

    // Proportional allocation based on DEFAULT_TOPICS
    // Easy: 86 total
    // Medium: 56 total
    // Hard: 15 total
    return dsaProgress.map(item => {
      const defaultItem = DEFAULT_TOPICS.find(t => t.topic === item.topic) || item;
      
      const easyAllocated = Math.round(easySolved * (defaultItem.easy / 86));
      const mediumAllocated = Math.round(mediumSolved * (defaultItem.medium / 56));
      const hardAllocated = Math.round(hardSolved * (defaultItem.hard / 15));
      const solvedAllocated = easyAllocated + mediumAllocated + hardAllocated;
      
      // Scale total topic problems proportionally
      const scaledTotal = Math.max(solvedAllocated + 10, defaultItem.total);
      
      return {
        topic: item.topic,
        solved: solvedAllocated,
        easy: easyAllocated,
        medium: mediumAllocated,
        hard: hardAllocated,
        total: scaledTotal
      };
    });
  }, [dsaProgress, leetcodeData]);

  const totalSolved = computedDsaProgress.reduce((sum, t) => sum + t.solved, 0);

  const value = useMemo(() => ({
    user, isLoggedIn, login, logout,
    authToken, registerUser, loginUser, updateProfile,
    runAIAnalysis, solveAIDoubt, generateAIRoadmap,
    fetchLatestAIAnalysis, fetchDoubtHistory, fetchLatestRoadmap,
    generateMockOA, fetchLatestMockOA, generateProblems, fetchLatestProblems,
    dsaProgress: computedDsaProgress, updateProgress, addTopic,
    streak, setStreak: updateStreak,
    activeTab, setActiveTab,
    totalSolved,
    leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData
  }), [user, isLoggedIn, login, logout, authToken, registerUser, loginUser, updateProfile, runAIAnalysis, solveAIDoubt, generateAIRoadmap, fetchLatestAIAnalysis, fetchDoubtHistory, fetchLatestRoadmap, generateMockOA, fetchLatestMockOA, generateProblems, fetchLatestProblems, computedDsaProgress, updateProgress, addTopic, updateStreak, activeTab, totalSolved, leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
