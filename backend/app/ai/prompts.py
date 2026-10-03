import json
from typing import Dict, Any, List

def build_question_prompt(
    language: str,
    topic: str,
    difficulty: str,
    question_type: str = "coding",
    user_context: str = ""
) -> str:
    return f"""You are an elite Computer Science educator and LeetCode/HackerRank problem creator.
Create a high-quality, original {difficulty.upper()}-level {question_type.upper()} problem for {language.upper()} on the topic "{topic}".

{f'Context: {user_context}' if user_context else ''}

CRITICAL: Return ONLY a raw JSON object (no markdown, no ```json ``` wrap, just valid JSON) adhering strictly to this schema:
{{
  "title": "Clear, concise title",
  "description": "Comprehensive problem statement explaining the scenario, requirements, and rules.",
  "difficulty": "{difficulty.lower()}",
  "language": "{language.lower()}",
  "topic": "{topic}",
  "question_type": "{question_type.lower()}",
  "input_format": "Detailed specification of input format and types",
  "output_format": "Detailed specification of expected return value or printed output",
  "constraints": "Array or bullet points of data size constraints, e.g. 1 <= n <= 10^5",
  "starter_code": "Proper language-specific starter template (e.g. def solution(args): or class Main)",
  "reference_solution": "Complete, optimal, fully working solution code in {language} that solves the problem and reads from stdin if needed",
  "solution_explanation": "In-depth breakdown of the optimal algorithm and approach",
  "hints": [
    "Hint 1 (Conceptual clue): High-level concept to remember",
    "Hint 2 (Approach clue): How to structure the algorithm",
    "Hint 3 (Algorithm clue): Key data structure or algorithmic technique",
    "Hint 4 (Pseudocode): Step-by-step logic",
    "Hint 5 (Detailed explanation): Near-complete solution logic without giving away full code"
  ],
  "test_cases": [
    {{"input": "sample_input_1", "expected_output": "sample_output_1", "is_hidden": false, "explanation": "Basic sample case"}},
    {{"input": "sample_input_2", "expected_output": "sample_output_2", "is_hidden": false, "explanation": "Second sample case"}},
    {{"input": "edge_case_input", "expected_output": "edge_case_output", "is_hidden": true, "explanation": "Boundary or edge case"}},
    {{"input": "large_case_input", "expected_output": "large_case_output", "is_hidden": true, "explanation": "Stress or large case"}}
  ],
  "options": [
    {{"key": "A", "text": "Option A text", "is_correct": false, "explanation": "Why this is incorrect"}},
    {{"key": "B", "text": "Option B text", "is_correct": true, "explanation": "Why this is correct"}},
    {{"key": "C", "text": "Option C text", "is_correct": false, "explanation": "Why this is incorrect"}},
    {{"key": "D", "text": "Option D text", "is_correct": false, "explanation": "Why this is incorrect"}}
  ]
}}

Note: If question_type is 'coding', 'test_cases' is required (at least 2 public, 2 hidden) and 'options' can be empty. If question_type is 'mcq' or 'output_prediction', 'options' is required and test_cases can be empty. Ensure test case inputs and expected outputs match exactly what the reference solution outputs."""

def build_code_review_prompt(
    code: str,
    language: str,
    question_title: str,
    question_desc: str,
    status: str
) -> str:
    return f"""You are a senior principal software engineer conducting a code review.
Problem: {question_title}
Language: {language}
Execution Status: {status}

User's Code:
```{language}
{code}
```

Analyze the code rigorously. Return ONLY a valid JSON object:
{{
  "overall_assessment": "Encouraging, constructive summary of the user's attempt",
  "strengths": ["Clear variable naming", "Handles base cases well"],
  "potential_bugs": ["Check for integer overflow on large N", "Missing empty list edge case"],
  "code_quality_score": 85,
  "time_complexity": "O(N log N)",
  "space_complexity": "O(N)",
  "optimization_suggestions": ["Can replace sorting with a min-heap to achieve O(N log K) time", "Use list comprehension"],
  "concept_explanation": "Explanation of the core computer science concept involved in this problem",
  "next_learning_step": "Recommended next concept or problem to practice"
}}"""

def build_hint_prompt(
    question_title: str,
    question_desc: str,
    hint_level: int,
    user_code: str = ""
) -> str:
    level_descriptions = {
        1: "Conceptual clue: A gentle nudge about the underlying CS concept without spoiling the algorithm",
        2: "Approach clue: Suggested mathematical or logical perspective to tackle the problem",
        3: "Algorithm clue: Specific data structure or algorithmic technique (e.g. Two Pointers, HashMap, DP)",
        4: "Pseudocode: Step-by-step pseudo-code outline of the solution",
        5: "Detailed explanation: Complete walkthrough of the implementation details"
    }
    return f"""The user is solving '{question_title}'.
Problem description: {question_desc[:300]}
User's current code: {user_code[:300] if user_code else 'Not written yet'}

Generate Level {hint_level} hint: {level_descriptions.get(hint_level, 'Helpful guidance')}.
Do NOT give the full raw code solution. Give progressive guidance.

Return ONLY JSON:
{{
  "level": {hint_level},
  "level_title": "Level {hint_level} Hint",
  "hint": "The concise, helpful hint text here...",
  "has_next": {str(hint_level < 5).lower()}
}}"""

def build_recommendation_prompt(progress_summary: List[Dict[str, Any]]) -> str:
    summary_str = json.dumps(progress_summary, indent=2)
    return f"""A programmer has practiced the following topics with their mastery percentages:
{summary_str}

Analyze their strengths and weaknesses. Recommend a personalized 3-step learning plan.
Return ONLY JSON:
{{
  "strengths_summary": "Summary of what they do well",
  "weaknesses_summary": "Key gaps in their knowledge",
  "recommended_focus": "The specific topic they should tackle next",
  "recommended_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "actionable_advice": "Specific practical advice for their next study session"
}}"""
