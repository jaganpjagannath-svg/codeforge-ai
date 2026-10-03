import { api } from '../api.js';
import { CodeEditor, STARTER_TEMPLATES } from '../components/editor.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderPractice(container, params = {}) {
  container.innerHTML = `
    <div class="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] overflow-hidden">
      <!-- Loading Spinner -->
      <div id="practice-loading" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
      <!-- IDE Workspace -->
      <div id="practice-workspace" class="hidden flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden"></div>
    </div>
  `;

  try {
    let questionId = params.q ? parseInt(params.q) : null;
    let questionsList = [];

    const qListRes = await api.getQuestions({
      language: params.lang,
      topic_id: params.topic,
      search: params.search
    });
    questionsList = qListRes;

    if (!questionId && questionsList.length > 0) {
      questionId = questionsList[0].id;
    }

    if (!questionId) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400">
          <p class="mb-4">No questions found matching your filter.</p>
          <a href="#/practice" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Reset Filter</a>
        </div>
      `;
      return;
    }

    const currentQuestion = await api.getQuestionDetail(questionId);
    const languages = await api.getLanguages();

    document.getElementById('practice-loading')?.classList.add('hidden');
    const workspace = document.getElementById('practice-workspace');
    workspace.classList.remove('hidden');

    initIDE(workspace, currentQuestion, questionsList, languages);

  } catch (err) {
    container.innerHTML = `
      <div class="p-8 text-center text-rose-400 text-xs">
        Failed to load Practice IDE: ${getErrorMessage(err)}
      </div>
    `;
  }
}

function initIDE(container, question, questionsList, languages) {
  let selectedLanguage = question.language_slug || 'python';
  let canSubmitCode = false; // Rule #25: Submit button disabled until all public test cases pass

  const html = `
    <!-- Mobile Segment Control Bar -->
    <div class="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-1">
      <button id="mobile-tab-problem" class="flex-1 py-1.5 text-xs font-medium text-center rounded-lg transition-colors bg-indigo-600/20 text-indigo-400">
        📖 Problem
      </button>
      <button id="mobile-tab-editor" class="flex-1 py-1.5 text-xs font-medium text-center rounded-lg transition-colors text-slate-400">
        💻 Code Editor
      </button>
      <button id="mobile-tab-results" class="flex-1 py-1.5 text-xs font-medium text-center rounded-lg transition-colors text-slate-400">
        🧪 Test Results
      </button>
    </div>

    <!-- 1. LEFT PANEL: Library Sidebar -->
    <div id="left-sidebar" class="hidden xl:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 overflow-y-auto">
      <div class="p-3 border-b border-slate-800 flex items-center justify-between">
        <span class="text-xs font-bold text-white tracking-wide">Problems Library</span>
        <span class="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">${questionsList.length}</span>
      </div>
      
      <div class="divide-y divide-slate-800/40 overflow-y-auto flex-1">
        ${questionsList.map(q => `
          <a href="#/practice?q=${q.id}" class="block p-3 hover:bg-slate-800/60 transition-colors ${q.id === question.id ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : ''}">
            <p class="text-xs font-semibold text-slate-200 truncate ${q.id === question.id ? 'text-indigo-400' : ''}">${q.title}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : (q.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400')}">${q.difficulty}</span>
              <span class="text-[10px] text-slate-500 uppercase font-mono">${q.language_slug}</span>
            </div>
          </a>
        `).join('')}
      </div>
    </div>

    <!-- 2. CENTER PANEL: Problem Statement & AI Hints -->
    <div id="panel-problem" class="flex-1 md:w-1/2 flex flex-col bg-slate-950 border-r border-slate-800 overflow-y-auto">
      <div class="p-5 space-y-5">
        
        <!-- Header & Badges -->
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="text-[10px] uppercase px-2 py-0.5 rounded font-bold ${question.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (question.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')}">
              ${question.difficulty}
            </span>
            <span class="text-[10px] uppercase px-2 py-0.5 rounded font-semibold bg-slate-800 text-indigo-400 border border-slate-700">
              ${question.language_slug}
            </span>
            <span class="text-[10px] uppercase px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              ${question.question_type}
            </span>
            ${question.created_by_ai ? `
              <span class="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i> AI Generated
              </span>
            ` : ''}
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight">${question.title}</h1>
        </div>

        <!-- Description -->
        <div class="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 prose prose-invert max-w-none">
          ${question.description.replace(/\n/g, '<br/>')}
        </div>

        <!-- Formats and Constraints -->
        ${question.input_format ? `
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div>
              <span class="font-bold text-slate-200">Input Format:</span>
              <p class="text-slate-400 mt-0.5">${question.input_format}</p>
            </div>
            <div>
              <span class="font-bold text-slate-200">Output Format:</span>
              <p class="text-slate-400 mt-0.5">${question.output_format || 'Standard return or printed output.'}</p>
            </div>
            ${question.constraints ? `
              <div>
                <span class="font-bold text-slate-200">Constraints:</span>
                <p class="text-slate-400 font-mono text-[11px] mt-0.5">${question.constraints}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- MCQ Options (If MCQ or Output Prediction) -->
        ${question.options && question.options.length > 0 ? `
          <div class="space-y-2 pt-2 border-t border-slate-800">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Select Correct Option</h4>
            <div class="space-y-2" id="mcq-options-container">
              ${question.options.map(opt => `
                <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors">
                  <input type="radio" name="mcq_answer" value="${opt.option_key}" class="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700" />
                  <span class="font-bold text-indigo-400 text-xs">${opt.option_key}.</span>
                  <span class="text-xs text-slate-200">${opt.text}</span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Public Sample Test Cases -->
        ${question.test_cases && question.test_cases.filter(tc => !tc.is_hidden).length > 0 ? `
          <div class="space-y-3 pt-2">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Required Public Test Cases</h4>
            <div class="space-y-2">
              ${question.test_cases.filter(tc => !tc.is_hidden).map((tc, idx) => `
                <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                  <div class="text-[10px] text-indigo-400 font-bold uppercase">Case #${idx + 1}</div>
                  <div><span class="text-slate-500">Input:</span> <span class="text-slate-200">${tc.input_data}</span></div>
                  <div><span class="text-slate-500">Expected Output:</span> <span class="text-emerald-400">${tc.expected_output}</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- AI Multi-Level Hints Accordion -->
        <div class="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="help-circle" class="w-4 h-4 text-indigo-400"></i>
              <span class="text-xs font-bold text-white uppercase tracking-wider">Progressive AI Hints</span>
            </div>
            <span class="text-[10px] text-slate-400">5 Levels Available</span>
          </div>

          <div class="flex flex-wrap gap-2" id="hint-buttons-row">
            ${[1, 2, 3, 4, 5].map(lvl => `
              <button class="hint-level-btn px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors" data-level="${lvl}">
                Hint ${lvl}
              </button>
            `).join('')}
          </div>

          <!-- Active Hint Display Box -->
          <div id="hint-display-box" class="hidden p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs text-indigo-200"></div>
        </div>

      </div>
    </div>

    <!-- 3. RIGHT PANEL: Code Editor & Execution Results -->
    <div id="panel-editor" class="flex-1 md:w-1/2 flex flex-col bg-slate-900 overflow-hidden">
      
      <!-- Editor Top Toolbar with Searchable SET LANGUAGE Menu (Section 15) -->
      <div class="flex items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-slate-800 relative z-30">
        
        <!-- Language Selector Button & Dropdown -->
        <div class="relative" id="set-language-wrapper">
          <button id="btn-set-language" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80 transition-all shadow-sm">
            <span id="active-lang-label" class="capitalize font-mono text-indigo-400">${selectedLanguage}</span>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider">SET LANGUAGE ▼</span>
          </button>

          <!-- Searchable Language Dropdown (Section 15) -->
          <div id="set-language-dropdown" class="hidden absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
            <div class="relative mb-2">
              <input 
                type="text" 
                id="search-lang-input"
                placeholder="Search language..." 
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div class="max-h-56 overflow-y-auto divide-y divide-slate-800/40" id="lang-items-container">
              ${languages.map(l => `
                <button class="lang-option-btn w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition-colors flex items-center justify-between ${l.slug === selectedLanguage ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-300'}" data-slug="${l.slug}" data-name="${l.name}">
                  <span>${l.name}</span>
                  <span class="text-[10px] text-slate-500 font-mono">${l.file_extension}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <button id="reset-code-btn" class="ml-2 p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Reset Starter Code">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Run & Submit Actions -->
        <div class="flex items-center gap-2">
          <button id="run-code-btn" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95 shadow-sm">
            <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Run Code</span>
          </button>

          <!-- Submit Button — Subject to Section 25 Rule -->
          <div class="relative group" id="submit-wrapper">
            <button 
              id="submit-code-btn" 
              disabled
              class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed font-bold text-xs border border-slate-700 transition-all shadow-sm"
              title="Pass all required public test cases before submitting"
            >
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              <span id="submit-btn-text">Submit</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Eligibility Notice Banner -->
      <div id="submission-eligibility-banner" class="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 text-[11px] flex items-center justify-between transition-colors">
        <span id="eligibility-status-text" class="text-amber-400/90 font-medium">
          🔒 Pass all required test cases before submitting.
        </span>
        <span id="eligibility-score-text" class="text-slate-500 font-mono text-[10px]">
          Public: 0 passed
        </span>
      </div>

      <!-- Monaco Editor Container -->
      <div class="flex-1 relative overflow-hidden" id="monaco-code-container"></div>

      <!-- Bottom Panel: Results & AI Feedback (Tabs) -->
      <div class="h-60 flex flex-col bg-slate-950 border-t border-slate-800 shrink-0" id="editor-bottom-panel">
        
        <!-- Tabs Bar -->
        <div class="flex items-center justify-between px-3 border-b border-slate-800 bg-slate-900/90 text-xs">
          <div class="flex items-center gap-2">
            <button id="tab-btn-console" class="px-3 py-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold transition-all">
              Test Results
            </button>
            <button id="tab-btn-custom-input" class="px-3 py-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold transition-all">
              Custom Input
            </button>
            <button id="tab-btn-ai-review" class="px-3 py-2 border-b-2 border-transparent text-purple-400 hover:text-purple-300 font-semibold transition-all flex items-center gap-1">
              <i data-lucide="sparkles" class="w-3 h-3"></i> AI Feedback
            </button>
          </div>
          <span id="exec-status-badge" class="hidden px-2 py-0.5 rounded text-[10px] font-bold"></span>
        </div>

        <!-- Tab 1: Test Results Console -->
        <div id="tab-content-console" class="flex-1 p-3 overflow-y-auto text-xs font-mono space-y-2">
          <p class="text-slate-500 font-sans">Click "Run Code" to test your solution against required public cases.</p>
        </div>

        <!-- Tab 2: Custom Input -->
        <div id="tab-content-custom-input" class="hidden flex-1 p-3 flex flex-col">
          <label class="text-[11px] text-slate-400 mb-1 font-sans">Enter custom test input passed to stdin:</label>
          <textarea id="custom-input-textarea" class="flex-1 w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-indigo-500" placeholder="Type input here..."></textarea>
        </div>

        <!-- Tab 3: AI Code Review Drawer -->
        <div id="tab-content-ai-review" class="hidden flex-1 p-3 overflow-y-auto text-xs space-y-3 font-sans">
          <p class="text-slate-500">Submit your code to receive automated Gemini AI review and complexity breakdown.</p>
        </div>

      </div>

    </div>
  `;

  container.innerHTML = html;
  lucide.createIcons();

  // Initialize Monaco Editor
  const starter = question.starter_code || STARTER_TEMPLATES[selectedLanguage] || '';
  const editor = new CodeEditor('monaco-code-container', {
    language: selectedLanguage,
    onRun: () => triggerRun(),
    onSubmit: () => triggerSubmit()
  });
  editor.init(starter);

  // Searchable Language Menu Setup (Section 15)
  const langBtn = document.getElementById('btn-set-language');
  const langDropdown = document.getElementById('set-language-dropdown');
  const langSearchInput = document.getElementById('search-lang-input');
  const langLabel = document.getElementById('active-lang-label');
  const langItems = container.querySelectorAll('.lang-option-btn');

  langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('hidden');
    if (!langDropdown.classList.contains('hidden')) {
      langSearchInput.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!document.getElementById('set-language-wrapper')?.contains(e.target)) {
      langDropdown?.classList.add('hidden');
    }
  });

  langSearchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    langItems.forEach(btn => {
      const name = btn.dataset.name.toLowerCase();
      const slug = btn.dataset.slug.toLowerCase();
      if (name.includes(term) || slug.includes(term)) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    });
  });

  langItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const newSlug = btn.dataset.slug;
      selectedLanguage = newSlug;
      langLabel.textContent = newSlug;
      langDropdown.classList.add('hidden');

      // Update active styling
      langItems.forEach(b => b.className = 'lang-option-btn w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition-colors flex items-center justify-between text-slate-300');
      btn.className = 'lang-option-btn w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition-colors flex items-center justify-between text-indigo-400 font-bold bg-indigo-500/10';

      // Update Monaco language and load starter template (Section 16: controls actual execution!)
      editor.setLanguage(newSlug);
      editor.setValue(STARTER_TEMPLATES[newSlug] || '');
      showToast(`Switched language to ${btn.dataset.name}. Compiler set to ${newSlug}.`);
    });
  });

  // Starter Code Reset
  document.getElementById('reset-code-btn')?.addEventListener('click', () => {
    if (confirm('Reset code to starter template?')) {
      editor.setValue(STARTER_TEMPLATES[selectedLanguage] || question.starter_code || '');
    }
  });

  // Mobile Views
  const tabProblem = document.getElementById('mobile-tab-problem');
  const tabEditor = document.getElementById('mobile-tab-editor');
  const tabResults = document.getElementById('mobile-tab-results');
  const panelProblem = document.getElementById('panel-problem');
  const panelEditor = document.getElementById('panel-editor');

  function setMobileView(tab) {
    if (tab === 'problem') {
      panelProblem.classList.remove('hidden');
      panelEditor.classList.add('hidden');
      tabProblem.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg bg-indigo-600/20 text-indigo-400';
      tabEditor.className = tabResults.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg text-slate-400';
    } else if (tab === 'editor') {
      panelProblem.classList.add('hidden');
      panelEditor.classList.remove('hidden');
      editor.layout();
      tabEditor.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg bg-indigo-600/20 text-indigo-400';
      tabProblem.className = tabResults.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg text-slate-400';
    } else if (tab === 'results') {
      panelProblem.classList.add('hidden');
      panelEditor.classList.remove('hidden');
      tabResults.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg bg-indigo-600/20 text-indigo-400';
      tabProblem.className = tabEditor.className = 'flex-1 py-1.5 text-xs font-medium text-center rounded-lg text-slate-400';
    }
  }

  tabProblem?.addEventListener('click', () => setMobileView('problem'));
  tabEditor?.addEventListener('click', () => setMobileView('editor'));
  tabResults?.addEventListener('click', () => setMobileView('results'));

  // Bottom Tabs
  const btnConsole = document.getElementById('tab-btn-console');
  const btnCustomInput = document.getElementById('tab-btn-custom-input');
  const btnAiReview = document.getElementById('tab-btn-ai-review');
  const contentConsole = document.getElementById('tab-content-console');
  const contentCustom = document.getElementById('tab-content-custom-input');
  const contentAi = document.getElementById('tab-content-ai-review');

  function switchBottomTab(active) {
    [btnConsole, btnCustomInput, btnAiReview].forEach(b => {
      b.className = 'px-3 py-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-semibold transition-all';
    });
    [contentConsole, contentCustom, contentAi].forEach(c => c.classList.add('hidden'));

    if (active === 'console') {
      btnConsole.className = 'px-3 py-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold transition-all';
      contentConsole.classList.remove('hidden');
    } else if (active === 'custom') {
      btnCustomInput.className = 'px-3 py-2 border-b-2 border-indigo-500 text-indigo-400 font-semibold transition-all';
      contentCustom.classList.remove('hidden');
    } else if (active === 'ai') {
      btnAiReview.className = 'px-3 py-2 border-b-2 border-purple-500 text-purple-400 font-semibold transition-all';
      contentAi.classList.remove('hidden');
    }
  }

  btnConsole.addEventListener('click', () => switchBottomTab('console'));
  btnCustomInput.addEventListener('click', () => switchBottomTab('custom'));
  btnAiReview.addEventListener('click', () => switchBottomTab('ai'));

  // AI Hints
  const hintBtns = container.querySelectorAll('.hint-level-btn');
  const hintDisplay = document.getElementById('hint-display-box');

  hintBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const level = parseInt(btn.dataset.level);
      hintDisplay.innerHTML = `<span class="animate-pulse">Consulting Gemini for Level ${level} clue...</span>`;
      hintDisplay.classList.remove('hidden');

      try {
        const hintRes = await api.getAIHint(question.id, level, editor.getValue());
        hintDisplay.innerHTML = `
          <div class="font-bold text-white mb-1">${hintRes.level_title}</div>
          <p class="text-slate-200 leading-relaxed">${hintRes.hint}</p>
        `;
      } catch (err) {
        hintDisplay.textContent = 'Could not load hint: ' + getErrorMessage(err);
      }
    });
  });

  // SUBMIT BUTTON STATE MANAGER (Section 25)
  const submitBtn = document.getElementById('submit-code-btn');
  const submitText = document.getElementById('submit-btn-text');
  const eligibilityBanner = document.getElementById('submission-eligibility-banner');
  const eligibilityStatus = document.getElementById('eligibility-status-text');
  const eligibilityScore = document.getElementById('eligibility-score-text');

  function updateSubmissionEligibility(allPassed, passedCount, totalCount) {
    canSubmitCode = allPassed;
    if (allPassed) {
      submitBtn.disabled = false;
      submitBtn.className = 'flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 animate-pulse';
      submitText.textContent = 'Submit Solution ✓';
      submitBtn.title = 'All public test cases passed! Ready for final submission.';

      eligibilityBanner.className = 'px-4 py-1.5 bg-emerald-950/40 border-b border-emerald-500/40 text-[11px] flex items-center justify-between transition-colors';
      eligibilityStatus.className = 'text-emerald-300 font-bold';
      eligibilityStatus.textContent = '✓ All public test cases passed! Submit button enabled.';
      eligibilityScore.className = 'text-emerald-400 font-mono text-[10px] font-bold';
      eligibilityScore.textContent = `Public: ${passedCount}/${totalCount} Passed`;
    } else {
      submitBtn.disabled = true;
      submitBtn.className = 'flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed font-bold text-xs border border-slate-700 transition-all shadow-sm';
      submitText.textContent = 'Submit';
      submitBtn.title = 'Pass all required public test cases before submitting';

      eligibilityBanner.className = 'px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 text-[11px] flex items-center justify-between transition-colors';
      eligibilityStatus.className = 'text-amber-400/90 font-medium';
      eligibilityStatus.textContent = '🔒 Pass all required test cases before submitting.';
      eligibilityScore.className = 'text-slate-500 font-mono text-[10px]';
      eligibilityScore.textContent = `Public: ${passedCount}/${totalCount} Passed`;
    }
  }

  // Run Code logic (Section 24)
  async function triggerRun() {
    const runBtn = document.getElementById('run-code-btn');
    runBtn.disabled = true;
    switchBottomTab('console');
    contentConsole.innerHTML = `<div class="text-slate-400 animate-pulse">Executing code in sandbox against public cases...</div>`;

    const code = editor.getValue();
    const customInp = document.getElementById('custom-input-textarea')?.value || '';

    try {
      const res = await api.runCode(code, selectedLanguage, customInp, question.id);
      renderRunResult(res);
      updateSubmissionEligibility(res.all_public_passed, res.public_cases_passed, res.total_public_cases);
    } catch (err) {
      contentConsole.innerHTML = `<div class="text-rose-400">Execution failed: ${getErrorMessage(err)}</div>`;
    } finally {
      runBtn.disabled = false;
    }
  }

  function renderRunResult(res) {
    const badge = document.getElementById('exec-status-badge');
    badge.className = `px-2 py-0.5 rounded text-[10px] font-bold ${res.all_public_passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
    badge.textContent = `${res.status} (${res.public_cases_passed}/${res.total_public_cases} Public Cases)`;
    badge.classList.remove('hidden');

    let tcHtml = '';
    if (res.test_case_results && res.test_case_results.length > 0) {
      tcHtml = `
        <div class="space-y-2 mt-2">
          ${res.test_case_results.map((tc, idx) => `
            <div class="p-2.5 rounded-lg border text-xs font-mono ${tc.passed ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}">
                  ${tc.passed ? '✓ Test Case' : '✕ Test Case'} #${idx + 1}
                </span>
                <span class="text-[10px] text-slate-500">${tc.execution_time_ms.toFixed(1)}ms</span>
              </div>
              <div class="text-slate-400 text-[11px] space-y-0.5 mt-1">
                <div>Input: <span class="text-slate-200">${tc.input_data}</span></div>
                <div>Your Output: <span class="${tc.passed ? 'text-emerald-300' : 'text-rose-300'}">${tc.actual_output}</span></div>
                ${!tc.passed ? `<div>Expected: <span class="text-emerald-400">${tc.expected_output}</span></div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    contentConsole.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1 font-sans">
          <div>
            <span class="font-bold text-white">Public Tests:</span> 
            <strong class="${res.all_public_passed ? 'text-emerald-400' : 'text-rose-400'}">${res.public_cases_passed} / ${res.total_public_cases} Passed</strong>
          </div>
          <div>Avg Time: <strong>${res.execution_time_ms} ms</strong> | Memory: <strong>${res.memory_kb} KB</strong></div>
        </div>
        ${tcHtml}
        ${res.stderr ? `
          <div class="mt-2">
            <div class="text-[10px] text-rose-400 uppercase font-semibold">Standard Error:</div>
            <pre class="bg-rose-950/40 p-2 rounded text-rose-300 mt-1 whitespace-pre-wrap">${res.stderr}</pre>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Submit Code logic (Section 25 & 26)
  async function triggerSubmit() {
    if (!canSubmitCode) {
      showToast('Pass all required public test cases before submitting.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    switchBottomTab('console');
    contentConsole.innerHTML = `<div class="text-slate-400 animate-pulse">Running full judge evaluation including hidden test cases...</div>`;

    const code = editor.getValue();

    try {
      const res = await api.submitCode(question.id, code, selectedLanguage);
      renderSubmitResult(res);

      if (res.status === 'Accepted') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
        showToast('Accepted! 100% of test cases passed! 🎉', 'success');
      } else {
        showToast(`Submission evaluated: ${res.status} (${res.test_cases_passed}/${res.total_test_cases} passed)`, 'info');
      }

      if (res.ai_feedback) {
        renderAIFeedback(res.ai_feedback);
      }

    } catch (err) {
      contentConsole.innerHTML = `<div class="text-rose-400">Submission failed: ${getErrorMessage(err)}</div>`;
      showToast(getErrorMessage(err), 'error');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function renderSubmitResult(res) {
    const badge = document.getElementById('exec-status-badge');
    badge.className = `px-2 py-0.5 rounded text-[10px] font-bold ${res.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
    badge.textContent = `${res.status} (${res.test_cases_passed}/${res.total_test_cases})`;
    badge.classList.remove('hidden');

    let html = `
      <div class="space-y-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold ${res.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}">${res.status}</span>
            <span class="text-xs text-slate-400">${res.test_cases_passed} / ${res.total_test_cases} Total Test Cases Passed</span>
          </div>
          <div class="text-xs text-slate-400 font-mono">
            <span>${res.execution_time_ms.toFixed(1)} ms</span> | <span>${res.memory_kb.toFixed(0)} KB</span>
          </div>
        </div>

        <!-- Test Case Matrix -->
        <div class="space-y-2">
          ${res.test_results.map((tc, idx) => `
            <div class="p-2.5 rounded-lg border text-xs font-mono ${tc.passed ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}">
                  ${tc.passed ? '✓ Test Case' : '✕ Test Case'} #${idx + 1} ${tc.is_hidden ? '(Hidden Evaluation Test)' : '(Public Test)'}
                </span>
                <span class="text-[10px] text-slate-500">${tc.execution_time_ms.toFixed(1)}ms</span>
              </div>
              ${!tc.is_hidden ? `
                <div class="text-slate-400 text-[11px] space-y-0.5 mt-1">
                  <div>Input: <span class="text-slate-200">${tc.input_data}</span></div>
                  <div>Your Output: <span class="${tc.passed ? 'text-emerald-300' : 'text-rose-300'}">${tc.actual_output}</span></div>
                  ${!tc.passed ? `<div>Expected: <span class="text-emerald-400">${tc.expected_output}</span></div>` : ''}
                </div>
              ` : `
                <div class="text-[10px] text-slate-500 italic">Hidden judge test case input and output protected.</div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    contentConsole.innerHTML = html;
  }

  function renderAIFeedback(fb) {
    contentAi.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-purple-300">Code Quality Score</span>
            <span class="font-bold text-purple-400">${fb.code_quality_score}/100</span>
          </div>
          <p class="text-slate-200 text-xs">${fb.overall_assessment}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Time Complexity</span>
            <p class="font-mono text-indigo-400 font-bold mt-0.5">${fb.time_complexity}</p>
          </div>
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Space Complexity</span>
            <p class="font-mono text-indigo-400 font-bold mt-0.5">${fb.space_complexity}</p>
          </div>
        </div>

        ${fb.strengths && fb.strengths.length > 0 ? `
          <div>
            <span class="text-[11px] font-bold text-emerald-400 uppercase">Key Strengths:</span>
            <ul class="list-disc list-inside text-xs text-slate-300 space-y-0.5 mt-1">
              ${fb.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fb.optimization_suggestions && fb.optimization_suggestions.length > 0 ? `
          <div>
            <span class="text-[11px] font-bold text-indigo-400 uppercase">Optimization Tips:</span>
            <ul class="list-disc list-inside text-xs text-slate-300 space-y-0.5 mt-1">
              ${fb.optimization_suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  document.getElementById('run-code-btn')?.addEventListener('click', triggerRun);
  document.getElementById('submit-code-btn')?.addEventListener('click', triggerSubmit);
}
