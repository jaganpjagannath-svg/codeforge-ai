import { api } from '../api.js';
import { getErrorMessage, validateEmail, validatePassword, validateConfirmPassword } from '../utils/errorHandler.js';

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
    info: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200'
  };

  const cleanMsg = getErrorMessage(message);

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium pointer-events-auto transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span class="flex-1">${cleanMsg}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function openAuthModal(defaultTab = 'login', onSuccess = null) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="auth-modal-overlay">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden" id="auth-modal-card">
        
        <!-- Close Button -->
        <button id="auth-modal-close" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>

        <!-- Brand Icon -->
        <div class="flex items-center gap-2 mb-4">
          <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <i data-lucide="terminal" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">CodeForge AI</h3>
            <p class="text-[11px] text-slate-400">Your AI-Powered Programming Platform</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-800 mb-5">
          <button id="tab-login-btn" class="flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-all ${defaultTab === 'login' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            Sign In
          </button>
          <button id="tab-register-btn" class="flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-all ${defaultTab === 'register' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}">
            Create Account
          </button>
        </div>

        <!-- Error Message Container (Never [object Object]) -->
        <div id="auth-error-msg" class="hidden mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <span>✕</span>
          <span id="auth-error-text" class="flex-1"></span>
        </div>

        <!-- Form -->
        <form id="auth-form" class="space-y-3.5">
          <div id="field-name-group" class="${defaultTab === 'login' ? 'hidden' : ''}">
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
            <input type="text" id="auth-input-name" placeholder="John Doe" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
            <input type="email" id="auth-input-email" placeholder="name@example.com" required class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-semibold text-slate-300">Password</label>
              <button type="button" id="forgot-password-link" class="text-[10px] text-indigo-400 hover:underline ${defaultTab === 'register' ? 'hidden' : ''}">
                Forgot password?
              </button>
            </div>
            <input type="password" id="auth-input-password" placeholder="Min. 8 characters" required class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <!-- Confirm Password Field (Registration & Reset) -->
          <div id="field-confirm-password-group" class="${defaultTab === 'login' ? 'hidden' : ''}">
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Confirm Password</label>
            <input type="password" id="auth-input-confirm-password" placeholder="Re-enter password" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <!-- Demo credentials badge -->
          <div id="demo-creds-badge" class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 flex items-center justify-between ${defaultTab === 'register' ? 'hidden' : ''}">
            <div>
              <span class="font-semibold text-indigo-400">Demo Account:</span> jagan@codeforge.ai / jagan123
            </div>
            <button type="button" id="fill-demo-btn" class="text-[10px] text-indigo-400 font-bold hover:underline">
              Auto Fill
            </button>
          </div>

          <button type="submit" id="auth-submit-btn" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-2">
            <span id="auth-btn-text">${defaultTab === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

      </div>
    </div>
  `;

  lucide.createIcons();

  let activeTab = defaultTab;
  const overlay = document.getElementById('auth-modal-overlay');
  const closeBtn = document.getElementById('auth-modal-close');
  const tabLogin = document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-register-btn');
  const nameGroup = document.getElementById('field-name-group');
  const confirmPasswordGroup = document.getElementById('field-confirm-password-group');
  const forgotLink = document.getElementById('forgot-password-link');
  const demoBadge = document.getElementById('demo-creds-badge');
  const btnText = document.getElementById('auth-btn-text');
  const errorMsg = document.getElementById('auth-error-msg');
  const errorText = document.getElementById('auth-error-text');
  const form = document.getElementById('auth-form');
  const fillDemoBtn = document.getElementById('fill-demo-btn');

  function showError(msg) {
    errorText.textContent = getErrorMessage(msg);
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
  }

  function closeModal() {
    modalContainer.innerHTML = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  tabLogin.addEventListener('click', () => {
    activeTab = 'login';
    tabLogin.className = 'flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 border-indigo-500 text-indigo-400 transition-all';
    tabRegister.className = 'flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all';
    nameGroup.classList.add('hidden');
    confirmPasswordGroup.classList.add('hidden');
    forgotLink.classList.remove('hidden');
    demoBadge.classList.remove('hidden');
    btnText.textContent = 'Sign In';
    hideError();
  });

  tabRegister.addEventListener('click', () => {
    activeTab = 'register';
    tabRegister.className = 'flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 border-indigo-500 text-indigo-400 transition-all';
    tabLogin.className = 'flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all';
    nameGroup.classList.remove('hidden');
    confirmPasswordGroup.classList.remove('hidden');
    forgotLink.classList.add('hidden');
    demoBadge.classList.add('hidden');
    btnText.textContent = 'Create Account';
    hideError();
  });

  forgotLink.addEventListener('click', () => {
    activeTab = 'forgot';
    tabLogin.className = tabRegister.className = 'flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 border-transparent text-slate-400 transition-all';
    nameGroup.classList.add('hidden');
    confirmPasswordGroup.classList.remove('hidden');
    forgotLink.classList.add('hidden');
    demoBadge.classList.add('hidden');
    btnText.textContent = 'Reset Password';
    document.getElementById('auth-input-password').placeholder = 'Enter new password (min 8 chars)';
    hideError();
    showToast('Enter your email and your new password to reset.', 'info');
  });

  fillDemoBtn?.addEventListener('click', () => {
    document.getElementById('auth-input-email').value = 'jagan@codeforge.ai';
    document.getElementById('auth-input-password').value = 'jagan123';
    hideError();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('auth-input-email').value.trim();
    const password = document.getElementById('auth-input-password').value;
    const name = document.getElementById('auth-input-name').value.trim();
    const confirmPassword = document.getElementById('auth-input-confirm-password')?.value;

    // Inline Frontend Validations (Prompt Section 7: immediate error feedback)
    const emailErr = validateEmail(email);
    if (emailErr) {
      showError(emailErr);
      return;
    }

    if (activeTab === 'register' || activeTab === 'forgot') {
      const pwdErr = validatePassword(password);
      if (pwdErr) {
        showError(pwdErr);
        return;
      }

      const matchErr = validateConfirmPassword(password, confirmPassword);
      if (matchErr) {
        showError(matchErr);
        return;
      }
    }

    const submitBtn = document.getElementById('auth-submit-btn');
    submitBtn.disabled = true;
    const origText = btnText.textContent;
    btnText.textContent = 'Processing...';

    try {
      if (activeTab === 'login') {
        await api.login(email, password);
        showToast('Successfully signed in! Welcome back.', 'success');
      } else if (activeTab === 'register') {
        await api.register(name || 'Programmer', email, password, confirmPassword);
        showToast('Account created successfully! Welcome to CodeForge AI.', 'success');
      } else if (activeTab === 'forgot') {
        await api.forgotPassword(email, password);
        showToast('Password reset successfully! Please sign in.', 'success');
        tabLogin.click();
        submitBtn.disabled = false;
        btnText.textContent = 'Sign In';
        return;
      }

      closeModal();
      window.dispatchEvent(new CustomEvent('auth-changed'));
      if (onSuccess) onSuccess();

    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = origText;
    }
  });
}
