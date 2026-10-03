import { api } from '../api.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderAdmin(container) {
  if (!api.user || api.user.role !== 'admin') {
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <i data-lucide="shield-alert" class="w-5 h-5"></i>
        </div>
        <h2 class="text-base font-bold text-white">Admin Privileges Required</h2>
        <p class="text-xs text-slate-400">You must be logged in as an administrator to access this dashboard.</p>
        <a href="#/dashboard" class="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">Return Home</a>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="flex-1 flex items-center justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  `;

  try {
    const stats = await api.getAdminStats();
    const questions = await api.getReviewQuestions();
    const users = await api.getUsers();

    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Platform Administration</h1>
            <p class="text-xs text-slate-400 mt-1">Review AI questions, manage users, and inspect judge operations.</p>
          </div>
          <span class="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            Admin Mode
          </span>
        </div>

        <!-- Platform Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Total Users</span>
            <span class="text-2xl font-extrabold text-white">${stats.total_users}</span>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Total Questions</span>
            <span class="text-2xl font-extrabold text-indigo-400">${stats.total_questions}</span>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Submissions</span>
            <span class="text-2xl font-extrabold text-white">${stats.total_submissions}</span>
          </div>
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[10px] uppercase text-slate-500 font-bold block mb-1">Acceptance Rate</span>
            <span class="text-2xl font-extrabold text-emerald-400">${stats.acceptance_rate}%</span>
          </div>
        </div>

        <!-- Question Moderation Section -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Question Library & Moderation</h3>
            <span class="text-xs text-slate-400">${questions.length} Questions</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3">Title</th>
                  <th class="px-4 py-3">Language</th>
                  <th class="px-4 py-3">Difficulty</th>
                  <th class="px-4 py-3">Type</th>
                  <th class="px-4 py-3">Source</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${questions.map(q => `
                  <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-3 font-semibold text-white">${q.title}</td>
                    <td class="px-4 py-3 uppercase text-slate-400 font-mono">${q.language}</td>
                    <td class="px-4 py-3 capitalize">${q.difficulty}</td>
                    <td class="px-4 py-3 uppercase font-mono">${q.type}</td>
                    <td class="px-4 py-3">${q.created_by_ai ? '<span class="text-purple-400">Gemini AI</span>' : 'Curated'}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${q.is_approved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
                        ${q.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right space-x-2">
                      ${!q.is_approved ? `
                        <button class="approve-q-btn text-emerald-400 hover:underline" data-id="${q.id}">Approve</button>
                      ` : ''}
                      <button class="delete-q-btn text-rose-400 hover:underline" data-id="${q.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Management Section -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Registered Users</h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">Streak</th>
                  <th class="px-4 py-3">Submissions</th>
                  <th class="px-4 py-3 text-right">Toggle Role</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${users.map(u => `
                  <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-3 font-semibold text-white">${u.name}</td>
                    <td class="px-4 py-3 text-slate-400">${u.email}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}">
                        ${u.role}
                      </span>
                    </td>
                    <td class="px-4 py-3">${u.streak_days} days</td>
                    <td class="px-4 py-3">${u.submissions_count}</td>
                    <td class="px-4 py-3 text-right">
                      <button class="toggle-user-role-btn text-indigo-400 hover:underline" data-id="${u.id}">
                        Make ${u.role === 'admin' ? 'User' : 'Admin'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    lucide.createIcons();

    // Attach actions
    container.querySelectorAll('.approve-q-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await api.approveQuestion(btn.dataset.id);
        showToast('Question approved!');
        renderAdmin(container);
      });
    });

    container.querySelectorAll('.delete-q-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this question?')) {
          await api.deleteQuestion(btn.dataset.id);
          showToast('Question deleted.');
          renderAdmin(container);
        }
      });
    });

    container.querySelectorAll('.toggle-user-role-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await api.toggleUserRole(btn.dataset.id);
        showToast('User role toggled.');
        renderAdmin(container);
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error: ${getErrorMessage(err)}</div>`;
  }
}
