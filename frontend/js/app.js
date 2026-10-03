// CodeForge AI - Main Single Page Application Router & Lifecycle Controller

import { api } from './api.js';
import { renderNavbar, renderMobileNav } from './components/navbar.js';
import { openAuthModal, showToast } from './components/modals.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderPractice } from './pages/practice.js';
import { renderAIGenerator } from './pages/aiGenerator.js';
import { renderTests } from './pages/tests.js';
import { renderTestRunner } from './pages/testRunner.js';
import { renderTestAnalytics } from './pages/testAnalytics.js';
import { renderHistory } from './pages/history.js';
import { renderAdmin } from './pages/admin.js';
import { renderProfile } from './pages/profile.js';
import { renderSettings } from './pages/settings.js';

let deferredInstallPrompt = null;

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.log('SW registration notice:', err));
  });
}

// PWA Installation Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  console.log('beforeinstallprompt captured!');

  // Show install banner if not dismissed
  showPwaInstallBanner();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  showToast('CodeForge AI installed successfully! Enjoy native coding.', 'success');
  hidePwaInstallBanner();
});

function showPwaInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (!banner) return;

  banner.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <i data-lucide="smartphone" class="w-5 h-5"></i>
        </div>
        <div>
          <h4 class="text-xs font-bold text-white">Install CodeForge AI</h4>
          <p class="text-[11px] text-slate-300">Install for offline access, full-screen editor & faster experience.</p>
        </div>
      </div>
      <button id="pwa-banner-close" class="text-slate-400 hover:text-white p-1">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
    <div class="flex items-center justify-end gap-2 mt-3">
      <button id="pwa-banner-install-btn" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95">
        Install App
      </button>
    </div>
  `;

  banner.classList.remove('hidden');
  lucide.createIcons();

  document.getElementById('pwa-banner-close')?.addEventListener('click', hidePwaInstallBanner);
  document.getElementById('pwa-banner-install-btn')?.addEventListener('click', triggerPwaInstall);
}

function hidePwaInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  banner?.classList.add('hidden');
}

async function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log(`User prompt outcome: ${outcome}`);
    deferredInstallPrompt = null;
    hidePwaInstallBanner();
  } else {
    // Helpful guide if already installed or on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      showToast('To install on iOS: Tap Share in Safari, then "Add to Home Screen" 📲', 'info', 6000);
    } else {
      showToast('App is already installed or ready in browser!', 'info');
    }
  }
}

// Global router dispatch
async function route() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  const [path, queryString] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString || ''));

  const container = document.getElementById('app-view');
  const routeName = path.split('/')[1] || 'dashboard';

  // Render Top & Bottom Nav
  renderNavbar(routeName);
  renderMobileNav(routeName);

  // Install button in navbar
  document.getElementById('nav-install-btn')?.addEventListener('click', triggerPwaInstall);
  document.getElementById('nav-login-btn')?.addEventListener('click', () => openAuthModal('login'));

  // Route Mapping
  if (path.startsWith('/test-analytics/')) {
    const code = path.replace('/test-analytics/', '');
    renderTestAnalytics(container, code);
  } else if (path.startsWith('/test/')) {
    const code = path.replace('/test/', '');
    renderTestRunner(container, code);
  } else {
    switch (routeName) {
      case 'dashboard':
        await renderDashboard(container);
        break;
      case 'practice':
        await renderPractice(container, params);
        break;
      case 'ai-studio':
        await renderAIGenerator(container);
        break;
      case 'tests':
        await renderTests(container);
        break;
      case 'history':
        await renderHistory(container);
        break;
      case 'admin':
        await renderAdmin(container);
        break;
      case 'profile':
        await renderProfile(container);
        break;
      case 'settings':
        await renderSettings(container);
        break;
      default:
        await renderDashboard(container);
        break;
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
window.addEventListener('hashchange', route);
window.addEventListener('auth-changed', () => {
  route();
});
window.addEventListener('trigger-pwa-install', triggerPwaInstall);

// Initial App Boot
document.addEventListener('DOMContentLoaded', async () => {
  // Check theme
  const savedTheme = localStorage.getItem('cf_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  // Verify auth session
  if (api.token) {
    try {
      await api.getMe();
    } catch {
      api.logout();
    }
  }

  route();
});
