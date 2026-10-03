import { api } from '../api.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderTests(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    </div>
  `;

  try {
    const tests = await api.listTests();
    const languages = await api.getLanguages();

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
        
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Coding Assessments & Tests</h1>
            <p class="text-xs text-slate-400 mt-1">
              Take timed programming tests, or create shareable assessment links for candidates and students.
            </p>
          </div>
          <button id="create-test-open-btn" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Create New Assessment</span>
          </button>
        </div>

        <!-- Tests List Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${tests.map(t => `
            <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    ${t.language_slug}
                  </span>
                  <div class="flex items-center gap-1.5 text-xs text-slate-400">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>${t.duration_minutes} mins</span>
                  </div>
                </div>

                <h3 class="text-base font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">${t.title}</h3>
                <p class="text-xs text-slate-400 line-clamp-2 mb-4">${t.description || 'Comprehensive programming assessment.'}</p>
                
                <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-center mb-4">
                  <div>
                    <span class="text-slate-500 block text-[9px] uppercase">Questions</span>
                    <strong class="text-slate-200">${t.questions_count}</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[9px] uppercase">Pass Score</span>
                    <strong class="text-emerald-400">${t.passing_score_percent}%</strong>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[9px] uppercase">Attempts</span>
                    <strong class="text-indigo-400">${t.attempts_count}</strong>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <a href="#/test/${t.share_code}" class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center transition-colors">
                  Take Test
                </a>
                <button class="copy-share-link-btn p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" data-code="${t.share_code}" title="Copy Share Link">
                  <i data-lucide="share-2" class="w-4 h-4"></i>
                </button>
                <a href="#/test-analytics/${t.share_code}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="View Creator Analytics">
                  <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                </a>
              </div>

            </div>
          `).join('')}
        </div>

      </div>

      <!-- Create Test Modal Container -->
      <div id="create-test-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"></div>
    `;

    lucide.createIcons();

    // Copy Share Link buttons
    container.querySelectorAll('.copy-share-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        const fullUrl = `${window.location.origin}/#/test/${code}`;
        navigator.clipboard.writeText(fullUrl);
        showToast('Shareable test link copied to clipboard! 📋');
      });
    });

    // Create Test Modal
    setupCreateTestModal(languages);

  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error: ${err.message}</div>`;
  }
}

function setupCreateTestModal(languages) {
  const openBtn = document.getElementById('create-test-open-btn');
  const modal = document.getElementById('create-test-modal');

  openBtn?.addEventListener('click', () => {
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <button id="close-create-modal" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <h3 class="text-base font-bold text-white mb-1">Create Assessment</h3>
        <p class="text-xs text-slate-400 mb-4">Set up a timed assessment and generate a shareable link.</p>

        <form id="create-test-form" class="space-y-4">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Test Title</label>
            <input type="text" id="ct-title" required placeholder="Python Full Assessment" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Description</label>
            <textarea id="ct-desc" rows="2" placeholder="Test instructions and candidate guidelines..." class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Programming Language</label>
              <select id="ct-lang" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                ${languages.map(l => `<option value="${l.slug}">${l.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Difficulty</label>
              <select id="ct-diff" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Duration (minutes)</label>
              <input type="number" id="ct-dur" value="30" min="5" max="180" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Passing Score (%)</label>
              <input type="number" id="ct-pass" value="60" min="20" max="100" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all active:scale-[0.98]">
            Create Assessment & Generate Share Link
          </button>
        </form>
      </div>
    `;

    lucide.createIcons();
    modal.classList.remove('hidden');

    document.getElementById('close-create-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    document.getElementById('create-test-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('ct-title').value.trim();
      const desc = document.getElementById('ct-desc').value.trim();
      const lang = document.getElementById('ct-lang').value;
      const diff = document.getElementById('ct-diff').value;
      const dur = parseInt(document.getElementById('ct-dur').value);
      const pass = parseInt(document.getElementById('ct-pass').value);

      try {
        const res = await api.createTest({
          title,
          description: desc,
          language_slug: lang,
          difficulty: diff,
          duration_minutes: dur,
          passing_score_percent: pass,
          is_randomized: true
        });

        modal.classList.add('hidden');
        showToast('Assessment created! Share code: ' + res.share_code, 'success');
        window.location.hash = `#/tests`;
        renderTests(document.getElementById('app-view'));
      } catch (err) {
        showToast('Failed to create assessment: ' + getErrorMessage(err), 'error');
      }
    });
  });
}
