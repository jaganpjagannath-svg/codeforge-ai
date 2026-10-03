import { api } from '../api.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderHistory(container) {
  if (!api.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <h2 class="text-base font-bold text-white">Sign In to View Submissions</h2>
        <p class="text-xs text-slate-400">Track all your past code executions, scores, and test outcomes.</p>
        <button id="history-login-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
          Sign In
        </button>
      </div>
    `;
    document.getElementById('history-login-btn')?.addEventListener('click', () => {
      import('../components/modals.js').then(m => m.openAuthModal('login'));
    });
    return;
  }

  container.innerHTML = `
    <div class="flex-1 flex items-center justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  `;

  try {
    const submissions = await api.getSubmissionHistory();

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Submission History</h1>
            <p class="text-xs text-slate-400 mt-1">Review your solved problems and execution metrics.</p>
          </div>
          <span class="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            Total Submissions: <strong>${submissions.length}</strong>
          </span>
        </div>

        <!-- Submissions Table -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          ${submissions.length > 0 ? `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="px-4 py-3">Problem Title</th>
                    <th class="px-4 py-3">Language</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Score</th>
                    <th class="px-4 py-3">Test Cases</th>
                    <th class="px-4 py-3">Execution Time</th>
                    <th class="px-4 py-3">Memory</th>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${submissions.map(s => `
                    <tr class="hover:bg-slate-800/30 transition-colors">
                      <td class="px-4 py-3 font-semibold text-white">${s.question_title}</td>
                      <td class="px-4 py-3 uppercase font-mono text-slate-400">${s.language}</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                          ${s.status}
                        </span>
                      </td>
                      <td class="px-4 py-3 font-bold text-slate-200">${s.score}%</td>
                      <td class="px-4 py-3 text-slate-400 font-mono">${s.test_cases_passed}</td>
                      <td class="px-4 py-3 text-slate-400 font-mono">${s.execution_time_ms.toFixed(1)} ms</td>
                      <td class="px-4 py-3 text-slate-400 font-mono">${s.memory_kb.toFixed(0)} KB</td>
                      <td class="px-4 py-3 text-slate-500">${new Date(s.created_at).toLocaleDateString()}</td>
                      <td class="px-4 py-3 text-right">
                        <a href="#/practice?q=${s.question_id}" class="text-indigo-400 hover:underline">Re-solve</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="p-8 text-center text-xs text-slate-500">
              No submissions recorded yet. Go to the Practice IDE and submit your first problem!
            </div>
          `}
        </div>

      </div>
    `;

    lucide.createIcons();

  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error: ${getErrorMessage(err)}</div>`;
  }
}
