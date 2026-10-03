import { api } from '../api.js';
import { showToast } from './modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export function renderAIInputBox(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const html = `
    <div class="relative rounded-2xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/10 transition-all">
      <div class="bg-slate-900 rounded-[14px] p-4 sm:p-5">
        
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </span>
            <h3 class="text-sm font-bold text-white tracking-wide">Gemini AI Problem Generator</h3>
          </div>
          <span class="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
            Natural Language AI Box
          </span>
        </div>

        <!-- Prompt Input Field -->
        <div class="relative">
          <textarea
            id="ai-box-prompt-input"
            rows="2"
            placeholder="Ask AI to generate a challenge... e.g. 'Give me a Python loops beginner question' or 'Generate a medium DSA array problem'"
            class="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
          ></textarea>
        </div>

        <!-- Dynamic Intent Badge (updates live as user types) -->
        <div id="ai-box-intent-badge" class="hidden flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px]"></div>

        <!-- Quick Chips & Action Button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
          <div class="flex flex-wrap items-center gap-1.5" id="ai-chips-list">
            <button class="ai-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50" data-prompt="Generate a Python loops beginner question">
              🐍 Python Loops (Easy)
            </button>
            <button class="ai-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50" data-prompt="Generate a medium DSA array problem with two pointers">
              🌲 DSA Arrays (Medium)
            </button>
            <button class="ai-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50" data-prompt="Give me a Java OOP inheritance question">
              ☕ Java OOP (Medium)
            </button>
            <button class="ai-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50" data-prompt="Generate an SQL joins practice query">
              🗄️ SQL Joins
            </button>
            <button class="ai-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors border border-slate-700/50" data-prompt="Give me a Machine Learning classification concept MCQ">
              🤖 ML Concept MCQ
            </button>
          </div>

          <button
            id="ai-box-submit-btn"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span id="ai-box-btn-label">Generate with AI</span>
          </button>
        </div>

      </div>
    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  const promptInput = document.getElementById('ai-box-prompt-input');
  const submitBtn = document.getElementById('ai-box-submit-btn');
  const btnLabel = document.getElementById('ai-box-btn-label');
  const intentBadge = document.getElementById('ai-box-intent-badge');
  const chips = container.querySelectorAll('.ai-chip');

  // Handle Chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      promptInput.value = chip.dataset.prompt;
      updateIntentPreview(promptInput.value);
    });
  });

  // Handle live intent detection
  let debounceTimer;
  promptInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateIntentPreview(promptInput.value);
    }, 300);
  });

  async function updateIntentPreview(text) {
    if (!text || text.length < 5) {
      intentBadge.classList.add('hidden');
      return;
    }
    try {
      const intent = await api.parseIntent(text);
      intentBadge.innerHTML = `
        <span class="text-slate-400">Detected:</span>
        <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium uppercase">${intent.language}</span>
        <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium capitalize">${intent.topic}</span>
        <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium capitalize">${intent.difficulty}</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium capitalize">${intent.question_type}</span>
      `;
      intentBadge.classList.remove('hidden');
    } catch {
      intentBadge.classList.add('hidden');
    }
  }

  // Handle Generation
  submitBtn.addEventListener('click', async () => {
    const promptText = promptInput.value.trim();
    if (!promptText) {
      promptInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');
    btnLabel.textContent = 'Generating...';

    try {
      const question = await api.generateAIQuestion({ prompt: promptText });
      if (options.onGenerated) {
        options.onGenerated(question);
      } else {
        // Navigate to practice page with new question
        window.location.hash = `#/practice?q=${question.id}`;
      }
    } catch (err) {
      showToast('Error generating question: ' + getErrorMessage(err), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
      btnLabel.textContent = 'Generate with AI';
    }
  });
}
