# ⚡ DSA Forge — AI-Powered Placement Prep Platform

## 🚀 Quick Start (Standalone)
1. Open `DSAForge.html` in your browser — no server needed!
2. Sign up or use demo credentials to log in

## 🔑 AI Features Setup
The AI features (Analysis, Roadmap, Problems, Mock OA, Readiness, Doubt Solver) require an Anthropic API key.

To enable AI features, the app makes calls to the Anthropic Claude API.
Get your API key at: https://console.anthropic.com

## 📦 Running from Source

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
cd dsa-tracker
npm install --legacy-peer-deps
npm start
```

### Build for Production
```bash
npm run build
```

## ✨ Features
- 🔐 User Authentication (Email + Google)
- 📊 DSA Progress Tracker (10+ topics, edit inline)
- 🧠 AI Weakness Analysis (Claude AI)
- 🗺 Personalized Roadmap Generator
- 🎯 Smart Problem Recommendations (LeetCode/GFG)
- 📝 Mock OA Generator (Amazon, Microsoft, Google, etc.)
- 🏆 Interview Readiness Score
- 🤖 AI Doubt Solver (code analysis + complexity)
- 🔥 Streak Tracker

## 🛠 Tech Stack
- React 18 with Context API
- Recharts for data visualization
- Claude AI (Anthropic) for all AI features
- Space Grotesk + Syne + JetBrains Mono fonts
- Pure CSS with CSS variables design system

## 📁 Project Structure
```
src/
  context/AppContext.js    — Global state
  pages/
    AuthPage.js            — Login/Signup
    Dashboard.js           — Overview + charts
    DSATracker.js          — Progress tracker
    AIAnalysis.js          — AI weakness analysis
    Roadmap.js             — Study roadmap generator
    Problems.js            — Problem recommendations
    MockOA.js              — Mock OA generator
    ReadinessScore.js      — Readiness assessment
    DoubtSolver.js         — Code analyzer
  components/
    Sidebar.js             — Navigation sidebar
  styles/global.css        — Design system
```
