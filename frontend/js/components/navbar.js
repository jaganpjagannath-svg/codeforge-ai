import { api } from '../api.js';

export function renderNavbar(currentRoute) {
  const user = api.user;
  const isDark = document.documentElement.classList.contains('dark');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  const navHtml = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Brand Logo -->
        <div class="flex items-center gap-3">
          <a href="#/dashboard" class="flex items-center gap-2 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <i data-lucide="terminal" class="w-5 h-5 text-white"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                CodeForge<span class="text-indigo-400 text-xs ml-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">AI</span>
              </span>
              <span class="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Learn • Code • Assess</span>
            </div>
          </a>

          <!-- Desktop Navigation Links -->
          <nav class="hidden lg:flex items-center gap-1 ml-6">
            <a href="#/dashboard" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentRoute === 'dashboard' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}">
              Dashboard
            </a>
            <a href="#/practice" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentRoute === 'practice' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}">
              Practice IDE
            </a>
            <a href="#/ai-studio" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentRoute === 'ai-studio' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}">
              ✨ AI Generator
            </a>
            <a href="#/tests" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentRoute === 'tests' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}">
              Assessments
            </a>
            <a href="#/history" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentRoute === 'history' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}">
              Progress & History
            </a>
            ${user && user.role === 'admin' ? `
              <a href="#/admin" class="px-3 py-1.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-colors">
                Admin Panel
              </a>
            ` : ''}
          </nav>
        </div>

        <!-- Global Search Bar (Middle) -->
        <div class="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-4 relative" id="search-container">
          <div class="relative w-full">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text" 
              id="global-search-input"
              placeholder="Search Python, Loops, Two Sum, SQL..." 
              class="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <!-- Dropdown search results -->
          <div id="search-results-dropdown" class="hidden absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto"></div>
        </div>

        <!-- Right Side: Streak, Install App, Theme, User Menu -->
        <div class="flex items-center gap-2 sm:gap-3">
          
          <!-- PWA Install Button (Disappears/Adapts in standalone mode) -->
          ${isStandalone ? `
            <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-emerald-400 border border-emerald-500/30">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              <span>App Active</span>
            </div>
          ` : `
            <button id="nav-install-btn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition-all active:scale-95" title="Install CodeForge AI on Mobile or Desktop">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Install App</span>
            </button>
          `}

          <!-- Streak Badge -->
          ${user ? `
            <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold" title="${user.streak_days} Day Streak!">
              <span class="animate-bounce">🔥</span>
              <span>${user.streak_days}d</span>
            </div>
          ` : ''}

          <!-- Theme Switcher -->
          <button id="theme-toggle-btn" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Toggle Dark/Light Mode">
            <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
          </button>

          <!-- User Menu / Auth Button -->
          ${user ? `
            <div class="relative" id="user-menu-dropdown-container">
              <button id="user-avatar-btn" class="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all">
                <img src="${user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}" alt="${user.name}" class="w-8 h-8 rounded-lg bg-slate-800 object-cover" />
                <span class="hidden xl:inline text-xs font-medium text-slate-300">${user.name.split(' ')[0]}</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>

              <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                <div class="px-3 py-2 border-b border-slate-800">
                  <p class="text-xs font-semibold text-white truncate">${user.name}</p>
                  <p class="text-[10px] text-slate-400 truncate">${user.email}</p>
                </div>
                <a href="#/profile" class="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors">
                  <i data-lucide="user" class="w-3.5 h-3.5"></i> Profile & Stats
                </a>
                <a href="#/settings" class="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors">
                  <i data-lucide="settings" class="w-3.5 h-3.5"></i> Settings & Gemini API
                </a>
                <button id="logout-btn" class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                  <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Log Out
                </button>
              </div>
            </div>
          ` : `
            <button id="nav-login-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm">
              Sign In
            </button>
          `}
        </div>

      </div>
    </div>
  `;

  const container = document.getElementById('global-navbar');
  container.innerHTML = navHtml;
  lucide.createIcons();

  // Attach search listeners
  setupSearch();
  // Attach user dropdown listeners
  setupUserDropdown();
  // Attach theme listener
  setupThemeToggle();
}

function setupSearch() {
  const input = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!input || !dropdown) return;

  let debounceTimer;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (!q) {
      dropdown.classList.add('hidden');
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const data = await api.globalSearch(q);
        renderSearchResults(data, dropdown);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 250);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!document.getElementById('search-container')?.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

function renderSearchResults(data, dropdown) {
  let html = '';
  const hasQuestions = data.questions && data.questions.length > 0;
  const hasTopics = data.topics && data.topics.length > 0;
  const hasTests = data.tests && data.tests.length > 0;

  if (!hasQuestions && !hasTopics && !hasTests) {
    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">No results found for "${data.query}"</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  if (hasQuestions) {
    html += `<div class="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Coding Problems</div>`;
    data.questions.forEach(q => {
      html += `
        <a href="#/practice?q=${q.id}" class="flex items-center justify-between px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs transition-colors">
          <span class="text-slate-200 font-medium truncate">${q.title}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : (q.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400')}">${q.difficulty}</span>
        </a>
      `;
    });
  }

  if (hasTopics) {
    html += `<div class="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 mt-2">Topics</div>`;
    data.topics.forEach(t => {
      html += `
        <a href="#/practice?topic=${t.id}" class="flex items-center justify-between px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs transition-colors">
          <span class="text-slate-200 truncate">${t.name}</span>
          <span class="text-[10px] text-indigo-400 uppercase">${t.category}</span>
        </a>
      `;
    });
  }

  if (hasTests) {
    html += `<div class="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 mt-2">Assessments</div>`;
    data.tests.forEach(t => {
      html += `
        <a href="#/test/${t.share_code}" class="flex items-center justify-between px-2 py-1.5 hover:bg-slate-800 rounded-lg text-xs transition-colors">
          <span class="text-slate-200 truncate">${t.title}</span>
          <span class="text-[10px] text-amber-400">${t.duration_minutes}m</span>
        </a>
      `;
    });
  }

  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

function setupUserDropdown() {
  const btn = document.getElementById('user-avatar-btn');
  const menu = document.getElementById('user-menu-dropdown');
  const logoutBtn = document.getElementById('logout-btn');

  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!document.getElementById('user-menu-dropdown-container')?.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      api.logout();
      window.location.hash = '#/dashboard';
    });
  }
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('cf_theme', isDark ? 'dark' : 'light');
    // Notify Monaco editor if active
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark } }));
    renderNavbar(window.location.hash.replace('#/', '') || 'dashboard');
  });
}

export function renderMobileNav(currentRoute) {
  const nav = document.getElementById('mobile-nav');
  if (!nav) return;

  const isHome = currentRoute === 'dashboard';
  const isPractice = currentRoute === 'practice';
  const isTests = currentRoute === 'tests' || currentRoute.startsWith('test');
  const isProgress = currentRoute === 'history';
  const isProfile = currentRoute === 'profile';

  nav.innerHTML = `
    <a href="#/dashboard" class="flex flex-col items-center justify-center min-h-[48px] min-w-[52px] py-1 px-1.5 text-[10px] font-bold tracking-tight uppercase transition-all active:scale-90 ${isHome ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}">
      <i data-lucide="layout-dashboard" class="w-5 h-5 mb-0.5 ${isHome ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
      <span>Home</span>
      ${isHome ? '<span class="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>' : '<span class="w-1 h-1 mt-0.5"></span>'}
    </a>
    <a href="#/practice" class="flex flex-col items-center justify-center min-h-[48px] min-w-[52px] py-1 px-1.5 text-[10px] font-bold tracking-tight uppercase transition-all active:scale-90 ${isPractice ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}">
      <i data-lucide="code-2" class="w-5 h-5 mb-0.5 ${isPractice ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
      <span>Practice</span>
      ${isPractice ? '<span class="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>' : '<span class="w-1 h-1 mt-0.5"></span>'}
    </a>
    <a href="#/tests" class="flex flex-col items-center justify-center min-h-[48px] min-w-[52px] py-1 px-1.5 text-[10px] font-bold tracking-tight uppercase transition-all active:scale-90 ${isTests ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}">
      <i data-lucide="file-check-2" class="w-5 h-5 mb-0.5 ${isTests ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
      <span>Tests</span>
      ${isTests ? '<span class="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>' : '<span class="w-1 h-1 mt-0.5"></span>'}
    </a>
    <a href="#/history" class="flex flex-col items-center justify-center min-h-[48px] min-w-[52px] py-1 px-1.5 text-[10px] font-bold tracking-tight uppercase transition-all active:scale-90 ${isProgress ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}">
      <i data-lucide="line-chart" class="w-5 h-5 mb-0.5 ${isProgress ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
      <span>Progress</span>
      ${isProgress ? '<span class="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>' : '<span class="w-1 h-1 mt-0.5"></span>'}
    </a>
    <a href="#/profile" class="flex flex-col items-center justify-center min-h-[48px] min-w-[52px] py-1 px-1.5 text-[10px] font-bold tracking-tight uppercase transition-all active:scale-90 ${isProfile ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}">
      <i data-lucide="user" class="w-5 h-5 mb-0.5 ${isProfile ? 'stroke-[2.5]' : 'stroke-[1.75]'}"></i>
      <span>Profile</span>
      ${isProfile ? '<span class="w-1 h-1 rounded-full bg-indigo-400 mt-0.5"></span>' : '<span class="w-1 h-1 mt-0.5"></span>'}
    </a>
  `;
  lucide.createIcons();
}
