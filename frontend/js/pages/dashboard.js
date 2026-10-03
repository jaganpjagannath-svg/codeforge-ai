import { api } from '../api.js';
import { renderAIInputBox } from '../components/aiBox.js';
import { openAuthModal } from '../components/modals.js';

export async function renderDashboard(container) {
  // If not logged in, prompt or show guest preview
  if (!api.user) {
    renderGuestWelcome(container);
    return;
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full animate-fade-in">
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    </div>
  `;

  try {
    const data = await api.getDashboardData();
    renderDashboardContent(container, data);
  } catch (err) {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          Failed to load dashboard data: ${err.message}. Please refresh or sign in again.
        </div>
      </div>
    `;
  }
}

function renderGuestWelcome(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full animate-fade-in">
      
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          Next-Gen AI Programming Learning & Assessment Platform
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Master Coding with <span class="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Gemini AI</span> & Real-time Compiler
        </h1>
        <p class="text-base text-slate-300 mb-8 max-w-2xl mx-auto">
          AI-generated challenges, progressive hints, multi-language sandbox compiler, topic-wise assessments, and shareable exam links.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <button id="guest-get-started-btn" class="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-95">
            Get Started Free
          </button>
          <a href="#/practice" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all">
            Explore Practice IDE
          </a>
        </div>
      </div>

      <!-- AI Prompt Box Preview -->
      <div id="guest-ai-box" class="max-w-3xl mx-auto mb-12"></div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
            <i data-lucide="code-2" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-2">Monaco Code Editor</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Professional VS Code editor in your browser. Syntax highlighting, starter templates, and multi-language support.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-2">Isolated Sandbox Judge</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Runs code safely against public and hidden test cases with timeouts, memory tracking, and reference solution validation.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <i data-lucide="share-2" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-2">Shareable Coding Tests</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Create timed online coding tests, invite candidates with a unique link, and view detailed participant analytics.
          </p>
        </div>
      </div>

    </div>
  `;

  lucide.createIcons();
  renderAIInputBox('guest-ai-box');
  document.getElementById('guest-get-started-btn')?.addEventListener('click', () => {
    openAuthModal('register');
  });
}

function renderDashboardContent(container, data) {
  const { user, stats, progress_cards, recent_activity, continue_learning, ai_recommendation } = data;

  const html = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 animate-fade-in">
      
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <h1 class="text-2xl font-extrabold text-white flex items-center gap-2">
            Welcome back, ${user.name.split(' ')[0]} 👋
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Keep your streak active! Today is a great day to master a new programming algorithm.
          </p>
        </div>

        <!-- Quick Stats Chips -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span class="text-lg">🔥</span>
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Streak</p>
              <p class="text-sm font-bold text-amber-400">${user.streak_days} Days</p>
            </div>
          </div>

          <div class="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span class="text-lg">⏳</span>
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Time Spent</p>
              <p class="text-sm font-bold text-indigo-400">${user.learning_time}</p>
            </div>
          </div>

          <div class="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span class="text-lg">🎯</span>
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Avg Score</p>
              <p class="text-sm font-bold text-emerald-400">${stats.average_score}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Natural Language AI Prompt Box -->
      <div id="dashboard-ai-box"></div>

      <!-- Continue Learning & AI Recommendation Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Continue Learning Card -->
        <div class="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Continue Learning</span>
              <span class="p-1 rounded bg-indigo-500/20 text-indigo-400"><i data-lucide="play" class="w-3.5 h-3.5"></i></span>
            </div>
            ${continue_learning ? `
              <h3 class="text-base font-bold text-white mb-1 line-clamp-1">${continue_learning.title}</h3>
              <div class="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <span class="capitalize font-semibold text-indigo-400">${continue_learning.language}</span>
                <span>•</span>
                <span>${continue_learning.topic}</span>
                <span>•</span>
                <span class="capitalize text-emerald-400">${continue_learning.difficulty}</span>
              </div>
            ` : `
              <p class="text-xs text-slate-400 mb-4">Start your first problem to build your learning path!</p>
            `}
          </div>
          <a href="#/practice${continue_learning ? `?q=${continue_learning.question_id}` : ''}" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center transition-all shadow-md shadow-indigo-600/20 active:scale-95">
            Resume Practice →
          </a>
        </div>

        <!-- AI Recommendation Card -->
        <div class="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-purple-950/20 border border-indigo-500/30">
          <div class="flex items-center gap-2 mb-2">
            <span class="p-1 rounded bg-purple-500/20 text-purple-400"><i data-lucide="brain-circuit" class="w-4 h-4"></i></span>
            <span class="text-xs font-bold text-purple-300 uppercase tracking-wider">AI Learning Recommendation</span>
          </div>
          <h4 class="text-sm font-bold text-white mb-2">${ai_recommendation.strengths_summary || 'Your foundation is progressing well.'}</h4>
          <p class="text-xs text-slate-300 mb-3">${ai_recommendation.actionable_advice || 'Continue practicing weak topics to boost mastery.'}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[11px] text-slate-400 font-medium">Recommended:</span>
            ${(ai_recommendation.recommended_topics || ['Loops', 'Arrays', 'Functions']).map(t => `
              <a href="#/practice?search=${t}" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors">
                ${t}
              </a>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Programming Language Progress Cards (8 Cards) -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-white tracking-tight">Language & Domain Progress</h2>
          <a href="#/practice" class="text-xs text-indigo-400 hover:underline">View All Topics →</a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          ${progress_cards.map(c => `
            <a href="#/practice?lang=${c.slug}" class="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">${c.name}</span>
                <span class="text-[11px] font-semibold text-slate-400">${c.mastery_percent}%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${c.mastery_percent}%; background-color: ${c.color}"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-500">
                <span>Solved: ${c.solved}</span>
                <span>Attempts: ${c.attempted}</span>
              </div>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Recent Submissions Activity -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-white tracking-tight">Recent Submissions</h2>
          <a href="#/history" class="text-xs text-indigo-400 hover:underline">Full History →</a>
        </div>

        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          ${recent_activity.length > 0 ? `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                  <tr>
                    <th class="px-4 py-3">Problem</th>
                    <th class="px-4 py-3">Language</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Score</th>
                    <th class="px-4 py-3">Pass Rate</th>
                    <th class="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${recent_activity.map(item => `
                    <tr class="hover:bg-slate-800/30 transition-colors">
                      <td class="px-4 py-3 font-medium text-white">${item.title}</td>
                      <td class="px-4 py-3 uppercase text-slate-400 font-mono">${item.language}</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${item.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                          ${item.status}
                        </span>
                      </td>
                      <td class="px-4 py-3 font-semibold text-slate-200">${item.score}%</td>
                      <td class="px-4 py-3 text-slate-400">${item.test_cases_passed}</td>
                      <td class="px-4 py-3 text-right">
                        <a href="#/practice?q=${item.question_id}" class="text-indigo-400 hover:underline text-xs">Review</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="p-8 text-center text-xs text-slate-400">
              No submissions yet. Pick a problem in the Practice IDE to get started!
            </div>
          `}
        </div>
      </div>

    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();
  renderAIInputBox('dashboard-ai-box');
}
