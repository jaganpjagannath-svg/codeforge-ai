import { api } from '../api.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderTestAnalytics(container, shareCode) {
  container.innerHTML = `
    <div class="flex-1 flex items-center justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  `;

  try {
    const analytics = await api.getTestAnalytics(shareCode);

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono text-indigo-400">Share Code: #${analytics.share_code}</span>
              <span class="text-[10px] text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded">Creator Analytics</span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">${analytics.title}</h1>
          </div>

          <div class="flex items-center gap-2">
            <button id="analytics-copy-link-btn" class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
              <span>Copy Link</span>
            </button>
            <a href="#/tests" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
              Back to Tests
            </a>
          </div>
        </div>

        <!-- Metrics Overview Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Participants</span>
            <span class="text-2xl font-extrabold text-white">${analytics.total_participants}</span>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Passed Count</span>
            <span class="text-2xl font-extrabold text-emerald-400">${analytics.passed_count}</span>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Average Score</span>
            <span class="text-2xl font-extrabold text-indigo-400">${analytics.average_score}%</span>
          </div>

          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Avg Time Taken</span>
            <span class="text-2xl font-extrabold text-amber-400">${Math.floor(analytics.average_time_seconds / 60)}m ${analytics.average_time_seconds % 60}s</span>
          </div>
        </div>

        <!-- Participants Table -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Candidate Submissions</h3>

          ${analytics.participants.length > 0 ? `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="px-4 py-3">Candidate</th>
                    <th class="px-4 py-3">Email</th>
                    <th class="px-4 py-3">Score</th>
                    <th class="px-4 py-3">Percentage</th>
                    <th class="px-4 py-3">Result</th>
                    <th class="px-4 py-3">Time</th>
                    <th class="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  ${analytics.participants.map(p => `
                    <tr class="hover:bg-slate-800/30 transition-colors">
                      <td class="px-4 py-3 font-semibold text-white">${p.candidate_name}</td>
                      <td class="px-4 py-3 text-slate-400">${p.candidate_email}</td>
                      <td class="px-4 py-3 text-slate-200 font-mono">${p.score} pts</td>
                      <td class="px-4 py-3 font-bold ${p.passed ? 'text-emerald-400' : 'text-rose-400'}">${p.percentage}%</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                          ${p.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-slate-400">${Math.floor(p.time_taken_seconds / 60)}m ${p.time_taken_seconds % 60}s</td>
                      <td class="px-4 py-3 text-slate-500">${new Date(p.completed_at || '').toLocaleDateString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="p-8 text-center text-xs text-slate-500">
              No participants have taken this assessment yet. Share the link to invite candidates!
            </div>
          `}
        </div>

      </div>
    `;

    lucide.createIcons();

    document.getElementById('analytics-copy-link-btn')?.addEventListener('click', () => {
      const url = `${window.location.origin}/#/test/${analytics.share_code}`;
      navigator.clipboard.writeText(url);
      showToast('Shareable link copied to clipboard!');
    });

  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error: ${getErrorMessage(err)}</div>`;
  }
}
