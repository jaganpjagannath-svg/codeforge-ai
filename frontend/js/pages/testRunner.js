import { api } from '../api.js';
import { CodeEditor } from '../components/editor.js';
import { showToast } from '../components/modals.js';
import { getErrorMessage } from '../utils/errorHandler.js';

export async function renderTestRunner(container, shareCode) {
  container.innerHTML = `
    <div class="flex-1 flex items-center justify-center p-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  `;

  try {
    const testData = await api.getTestByShareCode(shareCode);
    renderInstructions(container, testData);
  } catch (err) {
    container.innerHTML = `
      <div class="max-w-md mx-auto my-12 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center text-xs">
        Assessment "${shareCode}" not found or expired.
      </div>
    `;
  }
}

function renderInstructions(container, test) {
  const user = api.user;

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-10 w-full animate-fade-in space-y-6">
      
      <!-- Test Header Card -->
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            ${test.language_slug}
          </span>
          <span class="text-xs text-slate-400 font-mono">Code: #${test.share_code}</span>
        </div>

        <h1 class="text-2xl font-extrabold text-white tracking-tight">${test.title}</h1>
        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">${test.description || 'Welcome to this programming assessment.'}</p>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Duration</span>
            <strong class="text-amber-400 text-sm">${test.duration_minutes} Mins</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Total Questions</span>
            <strong class="text-indigo-400 text-sm">${test.questions_count}</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Passing Score</span>
            <strong class="text-emerald-400 text-sm">${test.passing_score_percent}%</strong>
          </div>
        </div>

        <!-- Rules & Guidelines -->
        <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <span class="font-bold text-slate-300 block mb-1">Assessment Guidelines:</span>
          <p>• The countdown timer begins as soon as you click <strong>Start Assessment</strong>.</p>
          <p>• Questions and options are randomized for each candidate.</p>
          <p>• You may test code against public test cases before submitting.</p>
          <p>• When the timer expires, the assessment will automatically submit your latest answers.</p>
        </div>

        <!-- Candidate Registration Form -->
        <form id="start-assessment-form" class="space-y-4 pt-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Candidate Name</label>
              <input type="text" id="candidate-name" required value="${user ? user.name : ''}" placeholder="Your Full Name" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Candidate Email</label>
              <input type="email" id="candidate-email" required value="${user ? user.email : ''}" placeholder="candidate@example.com" class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2">
            <i data-lucide="play" class="w-4 h-4"></i>
            <span>Start Timed Assessment</span>
          </button>
        </form>

      </div>

    </div>
  `;

  lucide.createIcons();

  document.getElementById('start-assessment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('candidate-name').value.trim();
    const email = document.getElementById('candidate-email').value.trim();

    try {
      const startRes = await api.startTestAttempt(test.share_code, name, email);
      launchActiveExamRoom(container, test, startRes.attempt_id, test.duration_minutes * 60);
    } catch (err) {
      showToast('Could not start assessment: ' + getErrorMessage(err), 'error');
    }
  });
}

function launchActiveExamRoom(container, test, attemptId, durationSeconds) {
  let remainingSeconds = durationSeconds;
  let activeQuestionIndex = 0;
  const candidateAnswers = {};
  const submittedQuestions = new Set();
  const questions = test.questions || [];
  let editorInstance = null;
  let timerInterval = null;

  // Render Exam Room Layout
  container.innerHTML = `
    <div class="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] overflow-hidden">
      
      <!-- Top Persistent Timer Banner -->
      <div class="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
        <div class="flex items-center gap-2">
          <span class="font-bold text-white truncate max-w-[180px] sm:max-w-xs">${test.title}</span>
          <span class="text-slate-500">|</span>
          <span class="text-slate-400">Question <span id="exam-q-current-idx">1</span> of ${questions.length}</span>
          <span id="exam-q-status-badge" class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/50">Not Attempted</span>
        </div>

        <div class="flex items-center gap-3">
          <!-- Countdown Display -->
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs font-bold" id="exam-timer-box">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
            <span id="exam-timer-display" class="text-emerald-400">00:00</span>
          </div>

          <button id="exam-final-submit-btn" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      <!-- Main Split Workspace -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        <!-- Left: Question Navigator & Statement -->
        <div class="w-full md:w-1/2 flex flex-col bg-slate-950 border-r border-slate-800 overflow-y-auto">
          
          <!-- Question Palette Bar -->
          <div class="p-2.5 px-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-900/60" id="exam-palette">
            ${questions.map((q, idx) => `
              <button class="palette-q-btn w-8 h-7 rounded-lg text-xs font-bold transition-all ${idx === 0 ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-800 text-slate-300'}" data-index="${idx}">
                ${idx + 1}
              </button>
            `).join('')}
          </div>

          <!-- Question Content Box -->
          <div class="p-5 space-y-4 flex-1 overflow-y-auto" id="exam-q-body"></div>

          <!-- Bottom Navigation -->
          <div class="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/80">
            <button id="exam-prev-btn" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 disabled:opacity-40">
              ← Previous
            </button>
            <button id="exam-next-btn" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500">
              Next Question →
            </button>
          </div>

        </div>

        <!-- Right: Code Editor / Answer Workspace -->
        <div class="w-full md:w-1/2 flex flex-col bg-slate-900 overflow-hidden" id="exam-answer-panel">
          <div class="p-2.5 px-4 border-b border-slate-800 flex items-center justify-between text-xs bg-slate-950/80 shrink-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-300">Your Response</span>
              <span class="text-[10px] text-slate-500 hidden sm:inline" id="exam-autosave-status">Auto-saved</span>
            </div>
            <div class="flex items-center gap-2">
              <button id="exam-submit-q-btn" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                <span id="exam-submit-q-label">Submit Question</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Answer Input Container -->
          <div class="flex-1 relative overflow-hidden flex flex-col" id="exam-editor-container"></div>
        </div>

      </div>

    </div>
  `;

  lucide.createIcons();

  // Setup Timer
  const timerDisplay = document.getElementById('exam-timer-display');
  const timerBox = document.getElementById('exam-timer-box');

  function updateTimer() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remainingSeconds < 60) {
      timerDisplay.className = 'text-rose-400 animate-pulse';
      timerBox.className = 'flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-500 font-mono text-xs font-bold';
    } else if (remainingSeconds < 300) {
      timerDisplay.className = 'text-amber-400';
    }

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      showToast('Time expired! Submitting assessment automatically...', 'warning');
      submitExam();
    }
    remainingSeconds--;
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  function updatePalette() {
    container.querySelectorAll('.palette-q-btn').forEach((btn, idx) => {
      const q = questions[idx];
      if (!q) return;
      const isCurrent = (idx === activeQuestionIndex);
      const isSubmitted = submittedQuestions.has(q.question_id);
      const hasAnswer = Boolean(candidateAnswers[q.question_id] && candidateAnswers[q.question_id].trim().length > 0);

      if (isSubmitted) {
        btn.className = `palette-q-btn w-8 h-7 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white flex items-center justify-center gap-0.5 ${isCurrent ? 'ring-2 ring-indigo-400 shadow-md shadow-emerald-500/30' : ''}`;
        btn.innerHTML = `<span class="text-[10px]">✓</span><span>${idx + 1}</span>`;
      } else if (isCurrent) {
        btn.className = 'palette-q-btn w-8 h-7 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-500/30';
        btn.textContent = `${idx + 1}`;
      } else if (hasAnswer) {
        btn.className = 'palette-q-btn w-8 h-7 rounded-lg text-xs font-bold transition-all bg-amber-600/80 text-white';
        btn.textContent = `${idx + 1}`;
      } else {
        btn.className = 'palette-q-btn w-8 h-7 rounded-lg text-xs font-bold transition-all bg-slate-800 text-slate-300 hover:bg-slate-700';
        btn.textContent = `${idx + 1}`;
      }
    });
  }

  function updateStatusBadge(questionId) {
    const badge = document.getElementById('exam-q-status-badge');
    const submitLabel = document.getElementById('exam-submit-q-label');
    if (!badge) return;

    if (submittedQuestions.has(questionId)) {
      badge.className = 'ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1';
      badge.innerHTML = `<span>✓</span><span>Submitted</span>`;
      if (submitLabel) submitLabel.textContent = 'Update Submission';
    } else if (candidateAnswers[questionId] && candidateAnswers[questionId].trim().length > 0) {
      badge.className = 'ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
      badge.textContent = '✎ In Progress';
      if (submitLabel) submitLabel.textContent = 'Submit Question';
    } else {
      badge.className = 'ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/50';
      badge.textContent = 'Not Attempted';
      if (submitLabel) submitLabel.textContent = 'Submit Question';
    }
  }

  // Render question index
  function loadQuestion(index) {
    activeQuestionIndex = index;
    const q = questions[index];
    if (!q) return;

    document.getElementById('exam-q-current-idx').textContent = index + 1;
    updateStatusBadge(q.question_id);
    updatePalette();

    // Update Prev / Next buttons
    const prevBtn = document.getElementById('exam-prev-btn');
    const nextBtn = document.getElementById('exam-next-btn');
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.textContent = index === questions.length - 1 ? 'Finish →' : 'Next Question →';

    // Render Question Body
    const qBody = document.getElementById('exam-q-body');
    qBody.innerHTML = `
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] uppercase px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-400">
            ${q.question_type}
          </span>
          <span class="text-[10px] text-slate-400 font-semibold">${q.points} Points</span>
        </div>
        <h2 class="text-lg font-bold text-white">${q.title}</h2>
      </div>

      <div class="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${q.description}</div>

      ${q.input_format ? `
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <div><strong class="text-slate-200">Input:</strong> <span class="text-slate-400">${q.input_format}</span></div>
          <div><strong class="text-slate-200">Output:</strong> <span class="text-slate-400">${q.output_format}</span></div>
        </div>
      ` : ''}

      ${q.public_test_cases ? `
        <div class="space-y-2 pt-2">
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Sample Cases</span>
          ${q.public_test_cases.map(tc => `
            <div class="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
              <div><span class="text-slate-500">In:</span> ${tc.input}</div>
              <div><span class="text-slate-500">Out:</span> <span class="text-emerald-400">${tc.expected_output}</span></div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Render Editor or Options on Right Panel
    const editorContainer = document.getElementById('exam-editor-container');
    editorContainer.innerHTML = '';

    if (q.question_type === 'coding') {
      const currentAnswer = candidateAnswers[q.question_id] || q.starter_code || '';
      
      editorContainer.innerHTML = `
        <div id="exam-monaco-mount" class="flex-1 min-h-[220px]"></div>
        
        <!-- Execution Panel for Coding Questions -->
        <div class="border-t border-slate-800 bg-slate-950 shrink-0 flex flex-col max-h-56">
          <div class="p-2 px-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-slate-300">Public Test Execution</span>
              <span id="exam-sample-status" class="text-[10px] text-slate-500">Ready to test</span>
            </div>
            <button id="exam-run-sample-btn" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors">
              <i data-lucide="play" class="w-3 h-3 text-indigo-400"></i>
              <span>Run Sample Cases</span>
            </button>
          </div>
          <div id="exam-sample-output" class="p-3 overflow-y-auto text-xs font-mono text-slate-400 bg-slate-950/95 flex-1 min-h-[60px]">
            Run your code against public sample cases before submitting this question.
          </div>
        </div>
      `;

      lucide.createIcons();

      editorInstance = new CodeEditor('exam-monaco-mount', {
        language: test.language_slug
      });
      editorInstance.init(currentAnswer);

      // Save answer periodically and update status
      const autoSaveTimer = setInterval(() => {
        if (editorInstance && activeQuestionIndex === index) {
          const val = editorInstance.getValue();
          candidateAnswers[q.question_id] = val;
          updateStatusBadge(q.question_id);
        } else {
          clearInterval(autoSaveTimer);
        }
      }, 1500);

      // Sample Test Execution Handler
      document.getElementById('exam-run-sample-btn')?.addEventListener('click', async () => {
        saveCurrentQuestionAnswer();
        const code = candidateAnswers[q.question_id] || '';
        const runBtn = document.getElementById('exam-run-sample-btn');
        const statusBadge = document.getElementById('exam-sample-status');
        const outputBox = document.getElementById('exam-sample-output');

        if (!code.trim()) {
          showToast('Please write some code before running tests', 'warning');
          return;
        }

        runBtn.disabled = true;
        runBtn.innerHTML = `<span class="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400 inline-block"></span> <span>Running...</span>`;
        statusBadge.textContent = 'Executing...';
        statusBadge.className = 'text-[10px] text-amber-400';

        try {
          const res = await api.runCode(code, test.language_slug, '', q.question_id);
          
          if (res.test_case_results && res.test_case_results.length > 0) {
            const passedCount = res.public_cases_passed || 0;
            const totalCount = res.total_public_cases || res.test_case_results.length;
            const allPassed = (passedCount === totalCount);

            statusBadge.textContent = allPassed ? `All Passed (${passedCount}/${totalCount})` : `Failed (${passedCount}/${totalCount})`;
            statusBadge.className = `text-[10px] font-bold ${allPassed ? 'text-emerald-400' : 'text-rose-400'}`;

            outputBox.innerHTML = `
              <div class="space-y-2">
                <div class="flex items-center gap-3 text-xs font-semibold">
                  <span class="${allPassed ? 'text-emerald-400' : 'text-rose-400'}">Status: ${res.status}</span>
                  <span class="text-slate-500">•</span>
                  <span class="text-slate-400">Avg Time: ${res.execution_time_ms}ms</span>
                </div>
                <div class="divide-y divide-slate-800/80 pt-1">
                  ${res.test_case_results.map((tc, tcIdx) => `
                    <div class="py-1.5 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="font-bold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}">${tc.passed ? '✓' : '✕'}</span>
                        <span class="text-slate-300">Case ${tcIdx + 1}</span>
                      </div>
                      <div class="text-right text-[11px]">
                        <span class="text-slate-500">In:</span> <span class="text-slate-300">${tc.input_data || 'empty'}</span>
                        <span class="text-slate-500 ml-2">Exp:</span> <span class="text-emerald-400">${tc.expected_output}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            statusBadge.textContent = res.status;
            statusBadge.className = `text-[10px] font-bold ${res.is_success ? 'text-emerald-400' : 'text-rose-400'}`;
            outputBox.innerHTML = `
              <div class="space-y-1">
                <div class="text-slate-300 font-semibold">Output:</div>
                <pre class="text-slate-200 whitespace-pre-wrap">${res.stdout || '(no output)'}</pre>
                ${res.stderr ? `<div class="text-rose-400 mt-2 font-semibold">Error:</div><pre class="text-rose-400 whitespace-pre-wrap">${res.stderr}</pre>` : ''}
              </div>
            `;
          }
        } catch (err) {
          statusBadge.textContent = 'Execution Error';
          statusBadge.className = 'text-[10px] font-bold text-rose-400';
          outputBox.innerHTML = `<span class="text-rose-400">${err.message}</span>`;
        } finally {
          runBtn.disabled = false;
          runBtn.innerHTML = `<i data-lucide="play" class="w-3 h-3 text-indigo-400"></i> <span>Run Sample Cases</span>`;
          lucide.createIcons();
        }
      });

    } else if (q.question_type === 'mcq' || q.question_type === 'output_prediction') {
      editorContainer.innerHTML = `
        <div class="p-6 space-y-4">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Your Answer:</h3>
          <div class="space-y-2.5">
            ${(q.options || []).map(opt => `
              <label class="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 cursor-pointer transition-colors ${candidateAnswers[q.question_id] === opt.key ? 'border-indigo-500 bg-indigo-500/10' : ''}">
                <input type="radio" name="exam_mcq_${q.question_id}" value="${opt.key}" ${candidateAnswers[q.question_id] === opt.key ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500" />
                <span class="font-bold text-indigo-400 text-xs">${opt.key}.</span>
                <span class="text-xs text-slate-200">${opt.text}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;

      editorContainer.querySelectorAll(`input[name="exam_mcq_${q.question_id}"]`).forEach(radio => {
        radio.addEventListener('change', (e) => {
          candidateAnswers[q.question_id] = e.target.value;
          updateStatusBadge(q.question_id);
          updatePalette();
        });
      });
    } else {
      // Freeform text
      editorContainer.innerHTML = `
        <div class="p-6 flex flex-col h-full">
          <textarea id="exam-text-answer" class="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed" placeholder="Write your explanation or code here...">${candidateAnswers[q.question_id] || ''}</textarea>
        </div>
      `;
      document.getElementById('exam-text-answer')?.addEventListener('input', (e) => {
        candidateAnswers[q.question_id] = e.target.value;
        updateStatusBadge(q.question_id);
        updatePalette();
      });
    }
  }

  // Load first question
  loadQuestion(0);

  // Submit current question button handler
  document.getElementById('exam-submit-q-btn')?.addEventListener('click', () => {
    saveCurrentQuestionAnswer();
    const q = questions[activeQuestionIndex];
    if (!q) return;

    const ans = candidateAnswers[q.question_id];
    if (!ans || !ans.trim()) {
      showToast('Please provide an answer before submitting this question.', 'warning');
      return;
    }

    submittedQuestions.add(q.question_id);
    updateStatusBadge(q.question_id);
    updatePalette();
    showToast(`Question ${activeQuestionIndex + 1} response saved & marked submitted!`, 'success');
  });

  // Palette buttons
  container.querySelectorAll('.palette-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      saveCurrentQuestionAnswer();
      loadQuestion(parseInt(btn.dataset.index));
    });
  });

  // Next / Prev buttons
  document.getElementById('exam-prev-btn')?.addEventListener('click', () => {
    if (activeQuestionIndex > 0) {
      saveCurrentQuestionAnswer();
      loadQuestion(activeQuestionIndex - 1);
    }
  });

  document.getElementById('exam-next-btn')?.addEventListener('click', () => {
    saveCurrentQuestionAnswer();
    if (activeQuestionIndex < questions.length - 1) {
      loadQuestion(activeQuestionIndex + 1);
    } else {
      promptFinalSubmit();
    }
  });

  document.getElementById('exam-final-submit-btn')?.addEventListener('click', () => {
    saveCurrentQuestionAnswer();
    promptFinalSubmit();
  });

  function promptFinalSubmit() {
    saveCurrentQuestionAnswer();
    const unsubmitted = questions.length - submittedQuestions.size;
    let confirmMsg = 'Are you ready to finish and submit your assessment?';
    if (unsubmitted > 0) {
      confirmMsg = `You have ${unsubmitted} unsubmitted question(s). Are you sure you want to finish and submit now?`;
    }
    if (confirm(confirmMsg)) {
      submitExam();
    }
  }

  function saveCurrentQuestionAnswer() {
    const q = questions[activeQuestionIndex];
    if (!q) return;
    if (q.question_type === 'coding' && editorInstance) {
      candidateAnswers[q.question_id] = editorInstance.getValue();
    }
  }

  async function submitExam() {
    clearInterval(timerInterval);
    saveCurrentQuestionAnswer();

    container.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p class="text-sm text-slate-300 font-semibold">Grading code execution & assessing results...</p>
      </div>
    `;

    try {
      const elapsed = durationSeconds - remainingSeconds;
      const result = await api.submitTestAttempt(test.share_code, attemptId, candidateAnswers, elapsed);
      renderExamResult(container, result);
    } catch (err) {
      container.innerHTML = `<div class="p-8 text-center text-rose-400 text-xs">Error submitting: ${err.message}</div>`;
    }
  }
}

function renderExamResult(container, res) {
  if (res.passed) {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  }

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-10 w-full animate-fade-in space-y-6">
      
      <!-- Result Banner -->
      <div class="p-6 rounded-2xl bg-slate-900 border ${res.passed ? 'border-emerald-500/40' : 'border-rose-500/40'} text-center space-y-3">
        <div class="inline-flex p-3 rounded-full ${res.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
          <i data-lucide="${res.passed ? 'check-circle-2' : 'x-circle'}" class="w-10 h-10"></i>
        </div>

        <h1 class="text-2xl font-extrabold text-white">
          Assessment ${res.passed ? 'Passed!' : 'Completed'}
        </h1>
        <p class="text-xs text-slate-400">${res.test_title}</p>

        <!-- Score Chips -->
        <div class="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs max-w-md mx-auto">
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Percentage</span>
            <strong class="text-lg font-bold ${res.passed ? 'text-emerald-400' : 'text-rose-400'}">${res.percentage}%</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Score</span>
            <strong class="text-lg font-bold text-white">${res.score} / ${res.total_possible_score}</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">Time Taken</span>
            <strong class="text-lg font-bold text-indigo-400">${Math.floor(res.time_taken_seconds / 60)}m ${res.time_taken_seconds % 60}s</strong>
          </div>
        </div>
      </div>

      <!-- Question Breakdown -->
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider">Question Breakdown</h3>

        <div class="divide-y divide-slate-800/60">
          ${res.question_breakdown.map((item, idx) => `
            <div class="py-3 flex items-center justify-between text-xs">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${item.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                  ${item.is_correct ? '✓' : '✕'}
                </span>
                <div>
                  <p class="font-semibold text-white">#${idx + 1} ${item.title}</p>
                  <p class="text-[10px] text-slate-400 uppercase font-mono">${item.type} ${item.test_cases_passed ? `• Tests: ${item.test_cases_passed}` : ''}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="font-bold text-white">${item.points_earned} / ${item.max_points} pts</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="flex items-center justify-center gap-4">
        <a href="#/dashboard" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors">
          Return to Dashboard
        </a>
        <a href="#/tests" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors">
          Browse More Assessments
        </a>
      </div>

    </div>
  `;

  lucide.createIcons();
}
