# CodeForge AI — Full-Stack AI-Powered Programming Learning & Assessment Platform

> A production-quality, responsive web application and installable Progressive Web App (PWA) combining ChatGPT-style AI interactions, LeetCode-style coding challenges, HackerRank-style isolated code execution, LMS progress tracking, and shareable exam assessments.

---

## 🌟 Key Highlights & Features

1. **AI Question & Test Generator (Powered by Gemini API)**
   - Natural language AI input box: e.g. *"Give me a Python loops beginner question"*, *"Generate a medium DSA array problem"*, or *"Create a 30-minute C++ assessment"*.
   - Structured JSON prompt engineering with strict schema validation.
   - Reference solution validation layer: automatically executes the reference solution in an isolated sandbox to compute and verify expected outputs before saving test cases.
   - Generates Basic, Edge, Boundary, and Large test cases.
   - Offline Resilient mode: High-quality curated fallback question bank ensures 100% functionality even when offline or before configuring an API key.

2. **Progressive Web App (PWA) with One-Click Install**
   - Installable on Android, iOS, Windows, macOS, and Linux.
   - Prominent **"📱 Install App"** button in navigation and profile with `beforeinstallprompt` support.
   - Offline caching via Service Worker (`sw.js`).
   - Web App Manifest (`manifest.json`) supporting standalone display mode and home-screen shortcuts.

3. **Multi-Language Isolated Code Sandbox & Judge**
   - Secure subprocess-based execution in isolated temporary environments.
   - Enforces execution timeouts (5s default) to prevent infinite loops (`while True: pass`).
   - Tracks CPU execution time (ms) and memory footprint (KB).
   - In-memory SQLite runner: creates temporary test schemas and executes candidate queries with table comparison.
   - Multi-language support: Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, and SQL.
   - Evaluates public and hidden test cases; conceals hidden inputs and outputs from candidate view.

4. **Multi-Level Progressive AI Hints**
   - **Hint 1:** Conceptual clue
   - **Hint 2:** Approach clue
   - **Hint 3:** Algorithm & data structure clue
   - **Hint 4:** Pseudocode outline
   - **Hint 5:** Comprehensive implementation walkthrough

5. **Post-Submission AI Code Review & Feedback**
   - Analyzes time complexity ($O(N)$, $O(N \log N)$, etc.) and space complexity.
   - Scores code quality (0–100) and detects subtle bugs or boundary condition misses.
   - Suggests performance and idiomatic optimizations without spoiling the full solution immediately.

6. **Timed Assessment & Shareable Test Platform**
   - Assessment creator: title, duration, passing score percentage, language, difficulty, and question pool.
   - Generates unique shareable link (e.g. `http://localhost:8000/#/test/py-mastery-01`).
   - Timed Exam Room: live countdown timer, auto-submit on expiration, randomized question & MCQ option ordering, server-side grading.
   - Creator Analytics Dashboard: participant list, scores, pass/fail status, and time taken.

7. **User Dashboard & Analytics**
   - Day streak counter with animated flame 🔥 badge.
   - Dynamic progress cards across 8 languages and domains (Python, Java, C, C++, JavaScript, SQL, AI/ML, DSA).
   - AI Personalized Learning Recommendation based on user mastery data.
   - Full submission history with filters by language, difficulty, and execution status.

8. **Admin Operations & Settings**
   - Review and moderate AI-generated questions (Approve / Reject).
   - User role management.
   - Secure Gemini API key configuration with masked storage and instant connection testing.

---

## 🚀 Quick Start & How to Run

### Prerequisites
- Python 3.10+ (Python 3.13 supported)
- Web browser (Chrome, Edge, Safari, Firefox)

### 1. Launch the Platform
In PowerShell or Command Prompt, run:
```powershell
cd c:\Users\jagan\OneDrive\Desktop\ai-code-platform
python run.py
```
*Or double-click `start.bat` on Windows!*

The script will automatically:
1. Initialize the SQLite database (`codemind.db`).
2. Seed 14 programming languages, hierarchical topics, curated problems with test cases, and ready-to-take assessments.
3. Start the high-performance FastAPI server at `http://localhost:8000`.
4. Open the web application in your default browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **User** | `jagan@codeforge.ai` | `jagan123` |
| **Admin** | `admin@codeforge.ai` | `admin123` |

*(You can also click "Auto Fill" in the Sign In modal or register a brand-new account!)*

---

## 📱 Installing on Mobile & Desktop (PWA)

### On Desktop (Chrome / Edge / Brave):
1. Open `http://localhost:8000`.
2. Click the **"📱 Install App"** button in the top navigation bar or the install icon in your browser URL bar.
3. CodeForge AI will launch as a standalone desktop app with native window borders and taskbar icon!

### On Mobile (Android / Chrome):
1. Connect your phone to the same Wi-Fi network and open `http://<your-computer-ip>:8000`.
2. Tap the **"Install App"** button at the top or the install prompt banner at the bottom.
3. CodeForge AI will be added to your mobile home screen with native app behavior and bottom navigation!

### On iOS (iPhone / iPad Safari):
1. Open `http://<your-computer-ip>:8000` in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.

---

## ⚙️ Configuring Google Gemini API Key

1. Log in to CodeForge AI.
2. Navigate to **Settings** (or click your avatar -> Settings).
3. Under **Google Gemini API Key**, paste your Gemini API key (e.g. `AIzaSy...`).
4. Click **"Save & Update Key"**.
5. Click **"Test API Connection"** to verify live connectivity with Gemini.
*(The key is stored securely in the local SQLite `system_settings` table and is never exposed in client scripts!)*

---

## 📂 Project Architecture

```
ai-code-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, static SPA mounting, CORS
│   │   ├── config.py            # Environment settings & secrets
│   │   ├── database.py          # SQLAlchemy SQLite connection & session
│   │   ├── models/              # User, Language, Topic, Question, TestCase, Test, Submission
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── auth/                # bcrypt hashing & PyJWT bearer authentication
│   │   ├── execution/           # Isolated sandbox runner & test case validator
│   │   ├── ai/                  # Gemini client, intent parser, prompt schemas, fallback data
│   │   ├── routes/              # Clean REST endpoints for all platform capabilities
│   │   └── seed.py              # 14 languages, topic hierarchies, and questions
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py          # Automated verification test suite
│
├── frontend/
│   ├── index.html               # SPA shell with PWA meta & CDN loaders
│   ├── manifest.json            # PWA Web App Manifest
│   ├── sw.js                    # Service Worker for offline caching & installability
│   ├── css/
│   │   └── styles.css           # Glassmorphism, animations, and Monaco layouts
│   └── js/
│       ├── api.js               # API client with JWT headers
│       ├── app.js               # Router, PWA install prompt handler, toast alerts
│       ├── components/          # Navbar, Monaco Editor, AI Box, Modals
│       └── pages/               # Dashboard, Practice IDE, AI Studio, Tests, Exam Hall, Analytics, Admin
│
├── run.py                       # One-click startup runner
├── start.bat                    # Windows batch launcher
├── .env.example
├── .gitignore
└── README.md
```

---

## ☁️ Deploying to Render

CodeForge AI is 100% production-ready for deployment on [Render](https://render.com) (or any modern cloud host like Railway, Fly.io, or Heroku).

### Step-by-Step Render Setup:
1. **Push your code to GitHub / GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com) and click **"New +"** -> **"Web Service"**.
3. Select your repository.
4. Configure the Web Service settings:
   - **Name**: `codeforge-ai` (or your choice)
   - **Region**: Choose the closest region (e.g. Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank — runs from repository root)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
     *(Or `uvicorn app:app --host 0.0.0.0 --port $PORT`)*
   - **Plan**: Free or Starter
5. Under **Advanced / Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = `generate-a-secure-random-string-here`
   - `GEMINI_API_KEY` = `your-gemini-api-key` *(optional, can also be configured in UI)*
   - `DATABASE_URL` = *(Optional: attach a Render PostgreSQL database URL. If left empty, SQLite `codemind.db` is used automatically with auto-seeding!)*
6. Set **Health Check Path** to:
   - `/health`
7. Click **"Deploy Web Service"**.

Render will install dependencies, initialize database tables, seed the 14 languages & challenge catalog, and serve both the FastAPI REST API and responsive PWA frontend on your `*.onrender.com` domain with automated SSL!

---

## 🧪 Running the Automated Test Suite

To verify all system components:
```powershell
python backend/tests/test_api.py
```
This tests:
- Healthcheck endpoint
- User registration, JWT issuance, and login
- Languages and hierarchical topic trees
- Question fetching and test case concealment
- Isolated sandbox code execution (Python, TLE handling, in-memory SQL)
- AI intent parser
- Timed shareable assessments
