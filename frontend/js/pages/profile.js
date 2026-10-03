import { api } from '../api.js';
import { showToast, openAuthModal } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderProfile(container) {
  if (!api.user) {
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <h2 class="text-base font-bold text-white">Sign In to View Your Profile</h2>
        <p class="text-xs text-slate-400">Manage your profile, password, and PWA installation settings.</p>
        <button id="profile-login-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
          Sign In
        </button>
      </div>
    `;
    document.getElementById('profile-login-btn')?.addEventListener('click', () => {
      openAuthModal('login');
    });
    return;
  }

  const user = api.user;

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
      
      <!-- Profile Header Card -->
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <img src="${user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}" alt="${user.name}" class="w-20 h-20 rounded-2xl bg-slate-800 object-cover shadow-lg border border-slate-700" />
        
        <div class="flex-1 text-center sm:text-left space-y-1">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 class="text-xl font-bold text-white">${user.name}</h1>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}">
              ${user.role}
            </span>
          </div>
          <p class="text-xs text-slate-400">${user.email}</p>
          <p class="text-[11px] text-slate-500">Member since ${new Date(user.created_at || '').toLocaleDateString()}</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-center">
            <span class="text-lg block">🔥</span>
            <span class="text-xs font-bold">${user.streak_days} Days</span>
          </div>
        </div>
      </div>

      <!-- PWA Mobile App Card -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <i data-lucide="smartphone" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Install CodeForge AI Mobile & Desktop App</h3>
            <p class="text-xs text-slate-300 mt-0.5">Install as a native application for instant access, offline mode, and full-screen coding.</p>
          </div>
        </div>

        <button id="profile-install-app-btn" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 shrink-0 flex items-center gap-2">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Install App Now</span>
        </button>
      </div>

      <!-- Account Settings Forms Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Edit Profile Form -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Update Details</h3>
          <form id="profile-edit-form" class="space-y-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
              <input type="text" id="prof-name" value="${user.name}" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Avatar Seed / URL</label>
              <input type="text" id="prof-avatar" value="${user.avatar_url || ''}" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
              Save Changes
            </button>
          </form>
        </div>

        <!-- Change Password Form -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Change Password</h3>
          <form id="profile-pwd-form" class="space-y-4">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Current Password</label>
              <input type="password" id="prof-curr-pwd" required placeholder="••••••••" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">New Password</label>
              <input type="password" id="prof-new-pwd" required placeholder="••••••••" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors">
              Update Password
            </button>
          </form>
        </div>

      </div>

    </div>
  `;

  lucide.createIcons();

  // PWA Install handler
  document.getElementById('profile-install-app-btn')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
  });

  // Edit Profile
  document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    const avatar = document.getElementById('prof-avatar').value.trim();
    try {
      const updated = await api.updateProfile(name, avatar);
      api.setAuth(api.token, updated);
      showToast('Profile updated successfully!');
      renderProfile(container);
    } catch (err) {
      showToast('Error updating profile: ' + getErrorMessage(err), 'error');
    }
  });

  // Change Password
  document.getElementById('profile-pwd-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const curr = document.getElementById('prof-curr-pwd').value;
    const next = document.getElementById('prof-new-pwd').value;
    try {
      await api.changePassword(curr, next);
      showToast('Password changed successfully!', 'success');
      document.getElementById('prof-curr-pwd').value = '';
      document.getElementById('prof-new-pwd').value = '';
    } catch (err) {
      showToast('Error changing password: ' + getErrorMessage(err), 'error');
    }
  });
}
