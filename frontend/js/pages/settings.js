import { api } from '../api.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderSettings(container) {
  if (!api.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <h2 class="text-base font-bold text-white">Sign In to Access Settings</h2>
        <a href="#/dashboard" class="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">Return Home</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex-1 flex items-center justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  `;

  try {
    const geminiSettings = await api.getGeminiSettings();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
        
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-extrabold text-white tracking-tight">Platform Settings</h1>
          <p class="text-xs text-slate-400 mt-1">Configure Gemini AI integration, code editor preferences, and sandbox parameters.</p>
        </div>

        <!-- Gemini API Key Management Card -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <i data-lucide="key" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Google Gemini API Key</h3>
                <p class="text-xs text-slate-400">Configure your personal Gemini API key for live AI questions, hints, and code review.</p>
              </div>
            </div>

            <span class="px-3 py-1 rounded-full text-xs font-bold ${geminiSettings.is_configured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
              ${geminiSettings.is_configured ? '● Live Gemini Active' : '● Offline Resilient Mode'}
            </span>
          </div>

          <!-- Notice Box -->
          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p class="text-slate-300 font-semibold">🔒 Security & Privacy Guarantee:</p>
            <p>• Your API key is stored securely on the backend in the database configuration table.</p>
            <p>• The raw key is <strong>never</strong> transmitted to frontend client scripts.</p>
            <p>• If no key is set, CodeForge automatically falls back to curated algorithmic challenge banks.</p>
          </div>

          <form id="gemini-key-form" class="space-y-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">
                ${geminiSettings.is_configured ? `Current Key: <span class="font-mono text-indigo-400">${geminiSettings.masked_key}</span>` : 'Paste New Gemini API Key'}
              </label>
              <div class="relative">
                <input
                  type="password"
                  id="gemini-key-input"
                  placeholder="AIzaSy..."
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95">
                Save & Update Key
              </button>
              <button type="button" id="test-gemini-btn" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5">
                <i data-lucide="activity" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Test API Connection</span>
              </button>
            </div>
          </form>

          <!-- Test Connection Result Display -->
          <div id="gemini-test-result" class="hidden p-3 rounded-xl text-xs"></div>
        </div>

        <!-- Editor Preferences Card -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 class="text-base font-bold text-white">Code Editor Preferences</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block text-slate-400 mb-1">Default Programming Language</label>
              <select id="pref-lang" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">Editor Theme</label>
              <select id="pref-theme" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white">
                <option value="vs-dark">VS Dark (Default)</option>
                <option value="vs">VS Light</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    `;

    lucide.createIcons();

    // Handle Gemini Key Save
    document.getElementById('gemini-key-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyVal = document.getElementById('gemini-key-input').value.trim();
      if (!keyVal) {
        showToast('Please enter a valid Gemini API key.', 'warning');
        return;
      }

      try {
        const res = await api.updateGeminiKey(keyVal);
        showToast('Gemini API key configured successfully!', 'success');
        renderSettings(container);
      } catch (err) {
        showToast('Error saving API key: ' + getErrorMessage(err), 'error');
      }
    });

    // Handle Connection Test
    document.getElementById('test-gemini-btn')?.addEventListener('click', async () => {
      const resultBox = document.getElementById('gemini-test-result');
      resultBox.className = 'p-3 rounded-xl text-xs bg-slate-950 border border-indigo-500/30 text-indigo-300 animate-pulse';
      resultBox.textContent = 'Testing connection with Google Gemini endpoint...';
      resultBox.classList.remove('hidden');

      try {
        const testRes = await api.testGeminiConnection();
        if (testRes.success) {
          resultBox.className = 'p-3 rounded-xl text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-300';
          resultBox.textContent = '✓ ' + testRes.message;
        } else {
          resultBox.className = 'p-3 rounded-xl text-xs bg-rose-950/40 border border-rose-500/40 text-rose-300';
          resultBox.textContent = '✕ ' + testRes.message;
        }
      } catch (err) {
        resultBox.className = 'p-3 rounded-xl text-xs bg-rose-950/40 border border-rose-500/40 text-rose-300';
        resultBox.textContent = 'Connection test failed: ' + err.message;
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error: ${err.message}</div>`;
  }
}
