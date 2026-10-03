// Monaco Editor Wrapper & Lifecycle Manager

export const STARTER_TEMPLATES = {
  python: `def solution():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    import sys\n    input_data = sys.stdin.read().strip()\n    solution()\n`,
  javascript: `const fs = require('fs');\n\nfunction solution(input) {\n    // Write your JavaScript solution\n    console.log(input);\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim();\nsolution(input);\n`,
  typescript: `function solution(input: string): void {\n    // TypeScript solution\n}\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write Java solution\n    }\n}\n`,
  cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Write C++ solution\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write C solution\n    return 0;\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Write C# solution\n    }\n}\n`,
  go: `package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write Go solution\n}\n`,
  rust: `use std::io::{self, Read};\n\nfn main() {\n    // Write Rust solution\n}\n`,
  sql: `-- Write your SQL query here\nSELECT * FROM table_name;\n`
};

export class CodeEditor {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.language = options.language || 'python';
    this.theme = document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs';
    this.onRun = options.onRun || null;
    this.onSubmit = options.onSubmit || null;
    this.editorInstance = null;
    this.fallbackTextarea = null;
  }

  async init(initialCode = '') {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = '';

    // If Monaco loader is present
    if (window.require && typeof window.require === 'function') {
      try {
        window.require.config({
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
        });

        await new Promise((resolve) => {
          window.require(['vs/editor/editor.main'], () => {
            resolve();
          });
        });

        const monacoLang = this.mapLanguage(this.language);
        this.editorInstance = monaco.editor.create(container, {
          value: initialCode || STARTER_TEMPLATES[this.language] || '',
          language: monacoLang,
          theme: this.theme,
          fontSize: 13,
          fontFamily: "'Fira Code', monospace",
          automaticLayout: true,
          minimap: { enabled: window.innerWidth > 768 },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          bracketPairColorization: { enabled: true },
          tabSize: 4,
          formatOnPaste: true,
          formatOnType: true
        });

        // Add keyboard shortcuts
        this.editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          if (this.onRun) this.onRun();
        });

        this.editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
          if (this.onSubmit) this.onSubmit();
        });

        // Listen for theme switch
        window.addEventListener('theme-changed', (e) => {
          const newTheme = e.detail.isDark ? 'vs-dark' : 'vs';
          monaco.editor.setTheme(newTheme);
        });

        return;
      } catch (err) {
        console.warn('Monaco loading error, falling back to clean text editor:', err);
      }
    }

    // High performance fallback editor with tab indent support
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full h-full p-4 font-mono text-sm bg-slate-900 text-slate-100 rounded-lg border border-slate-700/60 focus:outline-none focus:border-indigo-500 resize-none';
    textarea.value = initialCode || STARTER_TEMPLATES[this.language] || '';
    textarea.spellcheck = false;

    // Handle Tab key indent
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey && this.onSubmit) this.onSubmit();
        else if (this.onRun) this.onRun();
      }
    });

    container.appendChild(textarea);
    this.fallbackTextarea = textarea;
  }

  getValue() {
    if (this.editorInstance) {
      return this.editorInstance.getValue();
    }
    if (this.fallbackTextarea) {
      return this.fallbackTextarea.value;
    }
    return '';
  }

  setValue(code) {
    if (this.editorInstance) {
      this.editorInstance.setValue(code);
    } else if (this.fallbackTextarea) {
      this.fallbackTextarea.value = code;
    }
  }

  setLanguage(lang) {
    this.language = lang;
    const monacoLang = this.mapLanguage(lang);
    if (this.editorInstance && window.monaco) {
      const model = this.editorInstance.getModel();
      monaco.editor.setModelLanguage(model, monacoLang);
    }
  }

  mapLanguage(lang) {
    const map = {
      python: 'python',
      javascript: 'javascript',
      typescript: 'typescript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      sql: 'sql'
    };
    return map[lang.toLowerCase()] || 'plaintext';
  }

  resetStarterCode() {
    const starter = STARTER_TEMPLATES[this.language] || '';
    this.setValue(starter);
  }

  layout() {
    if (this.editorInstance) {
      this.editorInstance.layout();
    }
  }
}
