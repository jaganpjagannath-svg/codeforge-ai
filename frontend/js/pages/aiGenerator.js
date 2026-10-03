import { api } from '../api.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderAIGenerator(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8 w-full animate-fade-in space-y-6">
      
      <!-- Studio Header -->
      <div class="text-center max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-3">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          Gemini AI Studio
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">AI Question & Test Generator</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-2">
          Harness Google Gemini to craft custom algorithmic challenges, debugging exercises, MCQs, and complete assessments.
        </p>
      </div>

      <!-- Generator Card -->
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        
        <!-- Prompt Box -->
        <div>
          <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Natural Language Prompt</label>
          <textarea
            id="gen-prompt-input"
            rows="3"
            placeholder="e.g. 'Create an intermediate Python problem on dictionaries and hashing with 4 test cases' or 'Give me a 30-minute C++ assessment'"
            class="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
          ></textarea>
        </div>

        <!-- Quick Chips -->
        <div class="flex flex-wrap gap-2 text-xs">
          <button class="gen-chip px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60" data-p="Generate a Python loops beginner question">Python Loops (Easy)</button>
          <button class="gen-chip px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60" data-p="Generate a medium DSA array problem with two pointers">DSA Two Pointers (Medium)</button>
          <button class="gen-chip px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60" data-p="Create a Java OOP Polymorphism conceptual question">Java OOP Concept</button>
          <button class="gen-chip px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60" data-p="Fix the bug in a C++ dynamic array allocation">C++ Debugging Challenge</button>
          <button class="gen-chip px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60" data-p="SQL GROUP BY and HAVING clause challenge">SQL Aggregation</button>
        </div>

        <!-- Advanced Controls Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Language</label>
            <select id="gen-lang-select" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="sql">SQL</option>
              <option value="dsa">DSA</option>
              <option value="ai_ml">AI / ML</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Topic</label>
            <input type="text" id="gen-topic-input" placeholder="e.g. loops, recursion" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" value="loops" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Difficulty</label>
            <select id="gen-diff-select" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="easy">Easy (Beginner)</option>
              <option value="medium">Medium (Intermediate)</option>
              <option value="hard">Hard (Advanced)</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Question Type</label>
            <select id="gen-type-select" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
              <option value="coding">Coding Problem</option>
              <option value="mcq">MCQ Quiz</option>
              <option value="output_prediction">Output Prediction</option>
              <option value="debugging">Bug Fixing</option>
              <option value="conceptual">Conceptual Question</option>
              <option value="interview">Interview Question</option>
            </select>
          </div>
        </div>

        <!-- Action Button -->
        <button id="gen-submit-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
          <span id="gen-btn-label">Generate Question with Gemini</span>
        </button>

        <!-- Generation Progress Bar & Steps -->
        <div id="gen-progress-box" class="hidden p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2 text-xs">
          <div class="flex items-center justify-between text-purple-400 font-semibold">
            <span id="gen-step-text">Connecting to Gemini...</span>
            <span id="gen-step-percent">30%</span>
          </div>
          <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div id="gen-progress-bar" class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300" style="width: 30%"></div>
          </div>
        </div>

      </div>

    </div>
  `;

  lucide.createIcons();

  const promptInput = document.getElementById('gen-prompt-input');
  const langSelect = document.getElementById('gen-lang-select');
  const topicInput = document.getElementById('gen-topic-input');
  const diffSelect = document.getElementById('gen-diff-select');
  const typeSelect = document.getElementById('gen-type-select');
  const submitBtn = document.getElementById('gen-submit-btn');
  const btnLabel = document.getElementById('gen-btn-label');
  const progressBox = document.getElementById('gen-progress-box');
  const stepText = document.getElementById('gen-step-text');
  const stepPercent = document.getElementById('gen-step-percent');
  const progressBar = document.getElementById('gen-progress-bar');

  // Chips
  container.querySelectorAll('.gen-chip').forEach(c => {
    c.addEventListener('click', () => {
      promptInput.value = c.dataset.p;
    });
  });

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    progressBox.classList.remove('hidden');

    function updateStep(text, percent) {
      stepText.textContent = text;
      stepPercent.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;
    }

    updateStep('Sending structured prompt to Gemini API...', 25);

    try {
      setTimeout(() => updateStep('Validating schema and reference solution...', 60), 600);
      setTimeout(() => updateStep('Executing reference solution to verify test cases...', 85), 1200);

      const question = await api.generateAIQuestion({
        prompt: promptInput.value.trim() || undefined,
        language: langSelect.value,
        topic: topicInput.value.trim() || 'fundamentals',
        difficulty: diffSelect.value,
        question_type: typeSelect.value
      });

      updateStep('Verified & saved! Redirecting to IDE...', 100);
      showToast('Question successfully generated and verified!', 'success');

      setTimeout(() => {
        window.location.hash = `#/practice?q=${question.id}`;
      }, 500);

    } catch (err) {
      progressBox.classList.add('hidden');
      showToast('AI Generation Error: ' + getErrorMessage(err), 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
