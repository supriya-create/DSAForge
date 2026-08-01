import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '../components/ui';

const AppContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL || '';

const DEFAULT_TOPICS = [
  { topic: 'Arrays', solved: 0, easy: 0, medium: 0, hard: 0, total: 80 },
  { topic: 'Strings', solved: 0, easy: 0, medium: 0, hard: 0, total: 60 },
  { topic: 'Linked Lists', solved: 0, easy: 0, medium: 0, hard: 0, total: 40 },
  { topic: 'Trees', solved: 0, easy: 0, medium: 0, hard: 0, total: 50 },
  { topic: 'Graphs', solved: 0, easy: 0, medium: 0, hard: 0, total: 55 },
  { topic: 'Dynamic Programming', solved: 0, easy: 0, medium: 0, hard: 0, total: 70 },
  { topic: 'Heaps', solved: 0, easy: 0, medium: 0, hard: 0, total: 30 },
  { topic: 'Sorting', solved: 0, easy: 0, medium: 0, hard: 0, total: 35 },
  { topic: 'Binary Search', solved: 0, easy: 0, medium: 0, hard: 0, total: 40 },
  { topic: 'Recursion', solved: 0, easy: 0, medium: 0, hard: 0, total: 35 },
];

export const AppProvider = ({ children }) => {
  const { toast } = useToast(); // global feedback toasts (must be under ToastProvider)
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true); // true until the session is resolved from the cookie

  const [dsaProgress, setDsaProgress] = useState(DEFAULT_TOPICS);

  const [streak, setStreak] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: 'Mon', solved: 0 },
    { day: 'Tue', solved: 0 },
    { day: 'Wed', solved: 0 },
    { day: 'Thu', solved: 0 },
    { day: 'Fri', solved: 0 },
    { day: 'Sat', solved: 0 },
    { day: 'Sun', solved: 0 }
  ]);
  const [leetcodeData, setLeetCodeData] = useState(null);
  const [leetcodeLoading, setLeetCodeLoading] = useState(false);
  const [leetcodeError, setLeetCodeError] = useState(null);

  // Base request helper.
  // Security: authentication is carried by the httpOnly cookie via
  // credentials: 'include'. No token is stored in localStorage, so it cannot
  // be stolen by XSS. Handles 401 by logging out and forcing re-auth.
  const request = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    let response;
    try {
      response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (networkError) {
      throw new Error('Network error. Please check your connection.');
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      // Session expired / cookie missing — reset client state to force re-login.
      clearSession();
      throw new Error(data.message || 'Your session has expired. Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  }, []);

  // Reset all client-side state on logout / expired session.
  const clearSession = () => {
    setUser(null);
    setIsLoggedIn(false);
    setDsaProgress(DEFAULT_TOPICS);
    setStreak(0);
    setWeeklyActivity([
      { day: 'Mon', solved: 0 },
      { day: 'Tue', solved: 0 },
      { day: 'Wed', solved: 0 },
      { day: 'Thu', solved: 0 },
      { day: 'Fri', solved: 0 },
      { day: 'Sat', solved: 0 },
      { day: 'Sun', solved: 0 }
    ]);
    setLeetCodeData(null);
  };

  const login = useCallback((userData, leetcodeDataFromAuth = null) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (leetcodeDataFromAuth) {
      setLeetCodeData(leetcodeDataFromAuth);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Even if the server call fails, clear local state.
      console.warn('Logout request failed:', err.message);
    }
    clearSession();
  }, [request]);

  const registerUser = useCallback(async ({ name, email, password }) => {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    login(data.user, data.leetcodeData || null);
    return data;
  }, [request, login]);

  const loginUser = useCallback(async ({ email, password }) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    login(data.user, data.leetcodeData || null);
    return data;
  }, [request, login]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });
    login(data.user, data.leetcodeData || null);
    return data;
  }, [request, login]);

  const updateProfile = useCallback(async (profileData) => {
    const data = await request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (data?.success && data?.user) {
      setUser(data.user);
      toast({ type: 'success', title: 'Profile updated' });
    }
    return data;
  }, [request, toast]);

  const runAIAnalysis = useCallback(async (progress) => {
    return await request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  }, [request]);

  const solveAIDoubt = useCallback(async (code, question) => {
    return await request('/api/ai/doubt-solve', {
      method: 'POST',
      body: JSON.stringify({ code, question })
    });
  }, [request]);

  const generateAIRoadmap = useCallback(async (progress, weeks) => {
    return await request('/api/ai/roadmap', {
      method: 'POST',
      body: JSON.stringify({ progress, weeks })
    });
  }, [request]);

  const fetchLatestAIAnalysis = useCallback(async () => {
    return await request('/api/ai/analyze', { method: 'GET' });
  }, [request]);

  const fetchDoubtHistory = useCallback(async () => {
    return await request('/api/ai/doubt-history', { method: 'GET' });
  }, [request]);

  const fetchLatestRoadmap = useCallback(async () => {
    return await request('/api/ai/roadmap', { method: 'GET' });
  }, [request]);

  const generateMockOA = useCallback(async (company, difficulty, topics) => {
    return await request('/api/ai/mock-oa', {
      method: 'POST',
      body: JSON.stringify({ company, difficulty, topics })
    });
  }, [request]);

  const fetchLatestMockOA = useCallback(async () => {
    return await request('/api/ai/mock-oa', { method: 'GET' });
  }, [request]);

  const generateProblems = useCallback(async (platform, weakTopics) => {
    return await request('/api/ai/problems', {
      method: 'POST',
      body: JSON.stringify({ platform, weakTopics })
    });
  }, [request]);

  const fetchLatestProblems = useCallback(async () => {
    return await request('/api/ai/problems', { method: 'GET' });
  }, [request]);

  // Real server-side readiness assessment (no fabricated data).
  const calculateReadiness = useCallback(async () => {
    return await request('/api/readiness', { method: 'POST', body: JSON.stringify({}) });
  }, [request]);

  // On mount, resolve the session from the httpOnly cookie. If there is no
  // (valid) cookie, /me returns 401 and the user stays logged out.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const data = await request('/api/auth/me', { method: 'GET' });
        login(data.user, null);
      } catch (err) {
        // 401 (no session) is the expected case here — do not log as an error.
      } finally {
        setInitializing(false);
      }
    };
    bootstrap();
  }, [request, login]);

  useEffect(() => {
    const fetchTrackerData = async () => {
      if (isLoggedIn) {
        try {
          const data = await request('/api/tracker', { method: 'GET' });
          if (data && data.success) {
            setDsaProgress(data.dsaProgress);
            setStreak(data.streak);
            if (data.weeklyActivity) {
              setWeeklyActivity(data.weeklyActivity);
            }
          }

          await loadLeetCodeData();
        } catch (err) {
          console.error('Error fetching tracker data:', err.message);
        }
      }
    };
    fetchTrackerData();
  }, [isLoggedIn, request]);

  const updateProgress = useCallback(async (topic, updatedFields) => {
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
  }, [request]);

  const addTopic = useCallback(async (newTopic) => {
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
  }, [request]);

  const updateStreak = useCallback(async () => {
    // Streak is computed server-side from DailyActivity. There is intentionally
    // no client-endpoint to set it, so it cannot be forged.
    if (isLoggedIn) {
      try {
        const data = await request('/api/tracker', { method: 'GET' });
        if (data && data.success) {
          setStreak(data.streak);
        }
      } catch (err) {
        console.error('Error refreshing streak in backend:', err.message);
      }
    }
  }, [isLoggedIn, request]);

  const loadLeetCodeData = useCallback(async () => {
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
  }, [request]);

  const fetchLeetCodeData = useCallback(async (username) => {
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
      toast({ type: 'success', title: 'LeetCode synced', message: `Fetched latest stats for ${username}` });

      // Trigger a reload of the tracker progress and streak from the backend
      try {
        const trackerRes = await request('/api/tracker', { method: 'GET' });
        if (trackerRes && trackerRes.success) {
          setDsaProgress(trackerRes.dsaProgress);
          setStreak(trackerRes.streak);
          if (trackerRes.weeklyActivity) {
            setWeeklyActivity(trackerRes.weeklyActivity);
          }
        }
      } catch (trackerErr) {
        console.error('Error refreshing tracker data after sync:', trackerErr.message);
      }

      return userData;
    } catch (err) {
      console.error('LeetCode fetch error', err);
      setLeetCodeError('Unable to fetch LeetCode data.');
      setLeetCodeData(null);
      toast({ type: 'error', title: 'Sync failed', message: err.message });
      return null;
    } finally {
      setLeetCodeLoading(false);
    }
  }, [request, toast]);

  // REAL per-topic progress from the backend TopicProgress collection.
  // Data integrity: no fabricated numbers — this is whatever the server returned.
  const totalSolved = dsaProgress.reduce((sum, t) => sum + t.solved, 0);

  const value = useMemo(() => ({
    user, isLoggedIn, login, logout,
    registerUser, loginUser, loginWithGoogle, updateProfile,
    runAIAnalysis, solveAIDoubt, generateAIRoadmap,
    fetchLatestAIAnalysis, fetchDoubtHistory, fetchLatestRoadmap,
    generateMockOA, fetchLatestMockOA, generateProblems, fetchLatestProblems,
    calculateReadiness,
    dsaProgress, updateProgress, addTopic,
    streak, setStreak: updateStreak,
    weeklyActivity,
    totalSolved,
    leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData,
    initializing,
  }), [user, isLoggedIn, login, logout, registerUser, loginUser, loginWithGoogle, updateProfile, runAIAnalysis, solveAIDoubt, generateAIRoadmap, fetchLatestAIAnalysis, fetchDoubtHistory, fetchLatestRoadmap, generateMockOA, fetchLatestMockOA, generateProblems, fetchLatestProblems, calculateReadiness, dsaProgress, updateProgress, addTopic, updateStreak, weeklyActivity, totalSolved, leetcodeData, leetcodeLoading, leetcodeError, fetchLeetCodeData, initializing]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
