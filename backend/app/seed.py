import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.content import Language, Topic, Question, TestCase, QuestionOption
from app.models.test import Test, TestQuestion
from app.auth.security import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Users
        admin_user = db.query(User).filter(User.email == "admin@codeforge.ai").first()
        if not admin_user:
            admin_user = User(
                name="Admin Manager",
                email="admin@codeforge.ai",
                password_hash=hash_password("admin123"),
                role="admin",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=admin",
                streak_days=7,
                total_learning_seconds=14200
            )
            db.add(admin_user)

        demo_user = db.query(User).filter(User.email == "jagan@codeforge.ai").first()
        if not demo_user:
            demo_user = User(
                name="Jagan",
                email="jagan@codeforge.ai",
                password_hash=hash_password("jagan123"),
                role="user",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=jagan",
                streak_days=5,
                total_learning_seconds=9800
            )
            db.add(demo_user)

        db.commit()

        # 2. Seed Languages
        languages_data = [
            {
                "name": "Python", "slug": "python", "category": "language", "icon": "python",
                "file_extension": ".py", "display_order": 1,
                "starter_code_template": "def solution():\n    # Write your Python code here\n    pass\n\nif __name__ == '__main__':\n    import sys\n    data = sys.stdin.read().strip()\n    solution()\n"
            },
            {
                "name": "JavaScript", "slug": "javascript", "category": "language", "icon": "code",
                "file_extension": ".js", "display_order": 2,
                "starter_code_template": "const fs = require('fs');\n\nfunction solution(input) {\n    // Write your JavaScript code here\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim();\nsolution(input);\n"
            },
            {
                "name": "TypeScript", "slug": "typescript", "category": "language", "icon": "file-code",
                "file_extension": ".ts", "display_order": 3,
                "starter_code_template": "function solution(input: string): void {\n    // TypeScript solution\n}\n"
            },
            {
                "name": "Java", "slug": "java", "category": "language", "icon": "coffee",
                "file_extension": ".java", "display_order": 4,
                "starter_code_template": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write Java solution here\n    }\n}\n"
            },
            {
                "name": "C", "slug": "c", "category": "language", "icon": "terminal",
                "file_extension": ".c", "display_order": 5,
                "starter_code_template": "#include <stdio.h>\n\nint main() {\n    // Write C code here\n    return 0;\n}\n"
            },
            {
                "name": "C++", "slug": "cpp", "category": "language", "icon": "cpu",
                "file_extension": ".cpp", "display_order": 6,
                "starter_code_template": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write C++ code here\n    return 0;\n}\n"
            },
            {
                "name": "C#", "slug": "csharp", "category": "language", "icon": "hash",
                "file_extension": ".cs", "display_order": 7,
                "starter_code_template": "using System;\n\nclass Program {\n    static void Main() {\n        // C# code here\n    }\n}\n"
            },
            {
                "name": "Go", "slug": "go", "category": "language", "icon": "zap",
                "file_extension": ".go", "display_order": 8,
                "starter_code_template": "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Go solution\n}\n"
            },
            {
                "name": "Rust", "slug": "rust", "category": "language", "icon": "shield",
                "file_extension": ".rs", "display_order": 9,
                "starter_code_template": "use std::io::{self, Read};\n\nfn main() {\n    // Rust solution\n}\n"
            },
            {
                "name": "SQL", "slug": "sql", "category": "language", "icon": "database",
                "file_extension": ".sql", "display_order": 10,
                "starter_code_template": "-- Write your SQL query below\nSELECT * FROM employees;\n"
            },
            {
                "name": "Data Structures & Algorithms", "slug": "dsa", "category": "domain", "icon": "git-branch",
                "file_extension": ".py", "display_order": 11,
                "starter_code_template": "def solve(data):\n    pass\n"
            },
            {
                "name": "Artificial Intelligence & ML", "slug": "ai_ml", "category": "domain", "icon": "brain",
                "file_extension": ".py", "display_order": 12,
                "starter_code_template": "# AI / Machine Learning Implementation\n"
            },
            {
                "name": "Operating Systems", "slug": "os", "category": "theory", "icon": "layers",
                "file_extension": ".txt", "display_order": 13,
                "starter_code_template": ""
            },
            {
                "name": "DBMS", "slug": "dbms", "category": "theory", "icon": "server",
                "file_extension": ".sql", "display_order": 14,
                "starter_code_template": ""
            }
        ]

        lang_map = {}
        for l_data in languages_data:
            existing = db.query(Language).filter(Language.slug == l_data["slug"]).first()
            if not existing:
                existing = Language(**l_data)
                db.add(existing)
                db.flush()
            lang_map[l_data["slug"]] = existing

        db.commit()

        # 3. Seed Hierarchical Topics
        # Python hierarchy
        py_id = lang_map["python"].id
        dsa_id = lang_map["dsa"].id
        java_id = lang_map["java"].id
        sql_id = lang_map["sql"].id
        aiml_id = lang_map["ai_ml"].id

        topics_tree = [
            # Python
            {"lang_id": py_id, "name": "Fundamentals", "slug": "python-fundamentals", "category": "fundamentals", "subs": ["Variables", "Data Types", "Operators"]},
            {"lang_id": py_id, "name": "Control Flow", "slug": "loops", "category": "fundamentals", "subs": ["Conditional Statements", "For Loops", "While Loops"]},
            {"lang_id": py_id, "name": "Functions & Functional", "slug": "functions", "category": "intermediate", "subs": ["Functions", "Iterators & Generators", "Decorators"]},
            {"lang_id": py_id, "name": "Data Structures", "slug": "strings", "category": "intermediate", "subs": ["Strings", "Lists", "Tuples & Sets", "Dictionaries"]},
            {"lang_id": py_id, "name": "Object-Oriented Programming", "slug": "oop", "category": "advanced", "subs": ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation"]},
            {"lang_id": py_id, "name": "System & Files", "slug": "file-handling", "category": "advanced", "subs": ["File Handling", "Exception Handling", "Modules & Packages"]},

            # DSA
            {"lang_id": dsa_id, "name": "Linear Data Structures", "slug": "arrays", "category": "dsa", "subs": ["Arrays & Two Pointers", "Sliding Window", "Linked Lists", "Stack & Queue"]},
            {"lang_id": dsa_id, "name": "Searching & Sorting", "slug": "searching", "category": "dsa", "subs": ["Binary Search", "Merge Sort", "Quick Sort"]},
            {"lang_id": dsa_id, "name": "Non-Linear Structures", "slug": "trees", "category": "dsa", "subs": ["Binary Trees", "Binary Search Trees (BST)", "Heaps & Priority Queues", "Graphs"]},
            {"lang_id": dsa_id, "name": "Advanced Algorithmic Paradigms", "slug": "dynamic-programming", "category": "dsa", "subs": ["Recursion & Backtracking", "Dynamic Programming", "Greedy Algorithms"]},

            # SQL
            {"lang_id": sql_id, "name": "Basic Queries", "slug": "basic-sql", "category": "fundamentals", "subs": ["SELECT & WHERE", "ORDER BY & LIMIT"]},
            {"lang_id": sql_id, "name": "Table Joins & Aggregations", "slug": "joins", "category": "intermediate", "subs": ["INNER & LEFT JOIN", "GROUP BY & HAVING", "Subqueries & CTEs"]},

            # AI / ML
            {"lang_id": aiml_id, "name": "Supervised Learning", "slug": "classification", "category": "fundamentals", "subs": ["Linear & Logistic Regression", "Decision Trees & Random Forests", "Support Vector Machines"]},
            {"lang_id": aiml_id, "name": "Deep Learning & Generative AI", "slug": "neural-networks", "category": "advanced", "subs": ["Neural Networks", "CNNs & Computer Vision", "Transformers & LLMs"]}
        ]

        topic_map = {}
        for parent_group in topics_tree:
            p_top = db.query(Topic).filter(Topic.slug == parent_group["slug"]).first()
            if not p_top:
                p_top = Topic(
                    language_id=parent_group["lang_id"],
                    name=parent_group["name"],
                    slug=parent_group["slug"],
                    category=parent_group["category"],
                    display_order=len(topic_map) + 1
                )
                db.add(p_top)
                db.flush()
            topic_map[parent_group["slug"]] = p_top

            # Add subtopics
            for idx, sub_name in enumerate(parent_group.get("subs", [])):
                sub_slug = sub_name.lower().replace(" ", "-").replace("&", "and")
                existing_sub = db.query(Topic).filter(Topic.slug == sub_slug).first()
                if not existing_sub:
                    existing_sub = Topic(
                        language_id=parent_group["lang_id"],
                        parent_id=p_top.id,
                        name=sub_name,
                        slug=sub_slug,
                        category=parent_group["category"],
                        display_order=idx + 1
                    )
                    db.add(existing_sub)
                    db.flush()
                topic_map[sub_slug] = existing_sub

        db.commit()

        # 4. Seed Curated Questions with Public & Hidden Test Cases and Reference Solutions
        questions_to_seed = [
            {
                "title": "Reverse Words in a String",
                "slug": "reverse-words-in-string",
                "language_slug": "python",
                "topic_slug": "strings",
                "difficulty": "easy",
                "question_type": "coding",
                "description": "Given an input string `s`, reverse the order of the words.\nA word is defined as a sequence of non-space characters. The words in `s` will be separated by at least one space.\nReturn a string of the words in reverse order concatenated by a single space, with no leading or trailing spaces.",
                "input_format": "A single line containing the string s.",
                "output_format": "A single line containing the words reversed and separated by a single space.",
                "constraints": "1 <= len(s) <= 10^4\ns contains English letters, digits, and spaces.",
                "starter_code": "def reverse_words(s: str) -> str:\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    import sys\n    input_data = sys.stdin.read().strip()\n    print(reverse_words(input_data))\n",
                "reference_solution": "def reverse_words(s: str) -> str:\n    return ' '.join(s.split()[::-1])\n\nif __name__ == '__main__':\n    import sys\n    input_data = sys.stdin.read().strip()\n    print(reverse_words(input_data))\n",
                "explanation": "Splitting the string on whitespace handles multiple contiguous spaces and outer whitespaces cleanly. Reversing the array and joining with ' ' completes in O(N) time.",
                "hints": [
                    "Hint 1: In Python, `s.split()` automatically collapses multi-space delimiters.",
                    "Hint 2: Slicing with `[::-1]` reverses any list in Python.",
                    "Hint 3: Join words with `' '.join(...)` to format the output."
                ],
                "test_cases": [
                    {"input": "the sky is blue", "expected": "blue is sky the", "hidden": False},
                    {"input": "  hello world  ", "expected": "world hello", "hidden": False},
                    {"input": "a good   example", "expected": "example good a", "hidden": True},
                    {"input": "Alice Loves Python", "expected": "Python Loves Alice", "hidden": True}
                ]
            },
            {
                "title": "Sum of Even Numbers in a Range",
                "slug": "sum-of-even-numbers",
                "language_slug": "python",
                "topic_slug": "loops",
                "difficulty": "easy",
                "question_type": "coding",
                "description": "Write a program that takes two integers `start` and `end` from stdin (separated by a space or newline) and calculates the sum of all even integers between `start` and `end` inclusive.",
                "input_format": "Two integers: start and end.",
                "output_format": "A single integer representing the sum of all even numbers in [start, end].",
                "constraints": "-10^5 <= start <= end <= 10^5",
                "starter_code": "def sum_even_numbers(start: int, end: int) -> int:\n    # Your code here\n    return 0\n\nif __name__ == '__main__':\n    import sys\n    tokens = sys.stdin.read().split()\n    if tokens:\n        s, e = int(tokens[0]), int(tokens[1])\n        print(sum_even_numbers(s, e))\n",
                "reference_solution": "def sum_even_numbers(start: int, end: int) -> int:\n    total = 0\n    for n in range(start, end + 1):\n        if n % 2 == 0:\n            total += n\n    return total\n\nif __name__ == '__main__':\n    import sys\n    tokens = sys.stdin.read().split()\n    if tokens:\n        s, e = int(tokens[0]), int(tokens[1])\n        print(sum_even_numbers(s, e))\n",
                "explanation": "Iterate from start to end with a for loop. Use `% 2 == 0` to check evenness and accumulate.",
                "hints": [
                    "Hint 1: An integer `n` is even if `n % 2 == 0`.",
                    "Hint 2: Remember that range(start, end + 1) includes the end value."
                ],
                "test_cases": [
                    {"input": "1 10", "expected": "30", "hidden": False},
                    {"input": "4 4", "expected": "4", "hidden": False},
                    {"input": "5 7", "expected": "6", "hidden": True},
                    {"input": "-4 4", "expected": "0", "hidden": True}
                ]
            },
            {
                "title": "Two Sum - Target Pair Indices",
                "slug": "two-sum-target-pair",
                "language_slug": "dsa",
                "topic_slug": "arrays",
                "difficulty": "medium",
                "question_type": "coding",
                "description": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nReturn the answer formatted as two space-separated indices in ascending order.",
                "input_format": "Line 1: Target value\nLine 2: Array elements separated by spaces",
                "output_format": "Two space-separated indices 'i j' where i < j.",
                "constraints": "2 <= nums.length <= 10^5\n-10^9 <= nums[i], target <= 10^9",
                "starter_code": "def two_sum(nums, target):\n    # Write your solution here\n    return []\n\nif __name__ == '__main__':\n    import sys\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        target = int(lines[0].strip())\n        nums = list(map(int, lines[1].strip().split()))\n        res = two_sum(nums, target)\n        print(f\"{res[0]} {res[1]}\")\n",
                "reference_solution": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return sorted([seen[diff], i])\n        seen[num] = i\n    return []\n\nif __name__ == '__main__':\n    import sys\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        target = int(lines[0].strip())\n        nums = list(map(int, lines[1].strip().split()))\n        res = two_sum(nums, target)\n        print(f\"{res[0]} {res[1]}\")\n",
                "explanation": "Hash map records elements and indices for O(1) complement lookups, reducing time to O(N).",
                "hints": [
                    "Hint 1: Can you use extra space to avoid nested O(N^2) loops?",
                    "Hint 2: Map stores `seen[number] = index`."
                ],
                "test_cases": [
                    {"input": "9\n2 7 11 15", "expected": "0 1", "hidden": False},
                    {"input": "6\n3 2 4", "expected": "1 2", "hidden": False},
                    {"input": "6\n3 3", "expected": "0 1", "hidden": True},
                    {"input": "0\n-3 4 3 90", "expected": "0 2", "hidden": True}
                ]
            },
            {
                "title": "Python List vs Tuple Immutability",
                "slug": "python-list-vs-tuple",
                "language_slug": "python",
                "topic_slug": "python-fundamentals",
                "difficulty": "easy",
                "question_type": "mcq",
                "description": "Which of the following statements correctly describes the difference between a Python List and a Python Tuple?",
                "starter_code": None,
                "reference_solution": None,
                "explanation": "Lists are mutable sequences that can change size and elements in-place. Tuples are immutable and fixed once created.",
                "hints": ["Hint 1: What happens if you try `tuple[0] = 5`?"],
                "options": [
                    {"key": "A", "text": "Lists can only store numeric values, while tuples can store any data type.", "is_correct": False, "explanation": "Both store heterogeneous types."},
                    {"key": "B", "text": "Lists are mutable (can be altered), while Tuples are immutable (cannot be altered).", "is_correct": True, "explanation": "Correct! Mutability is the primary differentiator."},
                    {"key": "C", "text": "Tuples use brackets `[]` and lists use parentheses `()`.", "is_correct": False, "explanation": "Lists use `[]` and tuples use `()`."},
                    {"key": "D", "text": "Tuples cannot be indexed.", "is_correct": False, "explanation": "Tuples support indexing like `t[0]`."}
                ]
            },
            {
                "title": "Fix the Infinite Loop in Counter",
                "slug": "fix-infinite-loop-counter",
                "language_slug": "python",
                "topic_slug": "loops",
                "difficulty": "easy",
                "question_type": "debugging",
                "description": "The following code is supposed to print numbers from 1 up to `N` (inclusive) separated by spaces. However, the developer introduced a bug causing an infinite loop. Fix the bug.",
                "input_format": "A single integer N.",
                "output_format": "Space-separated numbers 1 through N.",
                "constraints": "1 <= N <= 100",
                "starter_code": "def print_numbers(n: int):\n    # FIX THIS BUGGY CODE\n    i = 1\n    res = []\n    while i <= n:\n        res.append(str(i))\n        # Bug: i is never incremented!\n    print(' '.join(res))\n\nif __name__ == '__main__':\n    import sys\n    n = int(sys.stdin.read().strip())\n    print_numbers(n)\n",
                "reference_solution": "def print_numbers(n: int):\n    i = 1\n    res = []\n    while i <= n:\n        res.append(str(i))\n        i += 1\n    print(' '.join(res))\n\nif __name__ == '__main__':\n    import sys\n    n = int(sys.stdin.read().strip())\n    print_numbers(n)\n",
                "explanation": "Increment `i += 1` inside the loop body to progress toward the loop termination condition.",
                "hints": [
                    "Hint 1: Check what happens to variable `i` in each iteration.",
                    "Hint 2: Add `i += 1` inside the `while` block."
                ],
                "test_cases": [
                    {"input": "5", "expected": "1 2 3 4 5", "hidden": False},
                    {"input": "1", "expected": "1", "hidden": False},
                    {"input": "8", "expected": "1 2 3 4 5 6 7 8", "hidden": True}
                ]
            },
            {
                "title": "Predict Output: Python Variable Scoping",
                "slug": "predict-output-scoping",
                "language_slug": "python",
                "topic_slug": "functions",
                "difficulty": "medium",
                "question_type": "output_prediction",
                "description": "What is the exact output of the following Python snippet?\n\nx = 10\ndef modify():\n    global x\n    x = 20\n\ndef check():\n    x = 30\n    modify()\n    print(x)\n\ncheck()\nprint(x)",
                "starter_code": None,
                "reference_solution": None,
                "explanation": "Inside `check()`, `x = 30` creates a local variable `x`. Calling `modify()` updates the global `x` to 20. Then `print(x)` in `check()` prints the local `x` (30). Finally, `print(x)` at module level prints the modified global `x` (20).",
                "hints": ["Hint 1: Distinguish between local and global variables inside functions."],
                "options": [
                    {"key": "A", "text": "30\n20", "is_correct": True, "explanation": "Local x is 30, global x was updated to 20 by modify()."},
                    {"key": "B", "text": "20\n20", "is_correct": False, "explanation": "The local variable in check() shadows global x."},
                    {"key": "C", "text": "30\n10", "is_correct": False, "explanation": "global x was modified to 20."},
                    {"key": "D", "text": "UnboundLocalError", "is_correct": False, "explanation": "No error occurs."}
                ]
            }
        ]

        seeded_questions = []
        for q_data in questions_to_seed:
            existing_q = db.query(Question).filter(Question.slug == q_data["slug"]).first()
            if not existing_q:
                top_obj = topic_map.get(q_data.get("topic_slug", ""))
                q = Question(
                    title=q_data["title"],
                    slug=q_data["slug"],
                    description=q_data["description"],
                    difficulty=q_data["difficulty"],
                    language_slug=q_data["language_slug"],
                    topic_id=top_obj.id if top_obj else None,
                    question_type=q_data["question_type"],
                    input_format=q_data.get("input_format"),
                    output_format=q_data.get("output_format"),
                    constraints=q_data.get("constraints"),
                    starter_code=q_data.get("starter_code"),
                    reference_solution=q_data.get("reference_solution"),
                    explanation=q_data.get("explanation"),
                    hints=json.dumps(q_data.get("hints", [])),
                    is_approved=True,
                    created_by_ai=False
                )
                db.add(q)
                db.flush()

                # Add test cases
                for tc in q_data.get("test_cases", []):
                    db_tc = TestCase(
                        question_id=q.id,
                        input_data=tc["input"],
                        expected_output=tc["expected"],
                        is_hidden=tc.get("hidden", False),
                        is_sample=not tc.get("hidden", False),
                        points=10
                    )
                    db.add(db_tc)

                # Add options
                for opt in q_data.get("options", []):
                    db_opt = QuestionOption(
                        question_id=q.id,
                        option_key=opt["key"],
                        text=opt["text"],
                        is_correct=opt["is_correct"],
                        explanation=opt.get("explanation")
                    )
                    db.add(db_opt)

                seeded_questions.append(q)

        db.commit()

        # 5. Seed Pre-configured Shareable Assessment
        sample_test = db.query(Test).filter(Test.share_code == "py-mastery-01").first()
        if not sample_test:
            sample_test = Test(
                share_code="py-mastery-01",
                title="Python Fundamentals & Problem Solving Assessment",
                description="Official assessment testing Python syntax, loops, strings, and problem-solving skills under timed conditions.",
                language_slug="python",
                difficulty="mixed",
                duration_minutes=30,
                passing_score_percent=60,
                is_randomized=True,
                creator_id=admin_user.id
            )
            db.add(sample_test)
            db.flush()

            all_qs = db.query(Question).filter(Question.language_slug == "python").all()
            for idx, q_item in enumerate(all_qs[:5]):
                tq = TestQuestion(
                    test_id=sample_test.id,
                    question_id=q_item.id,
                    points=20,
                    display_order=idx + 1
                )
                db.add(tq)

            db.commit()

        print("[Seed] Successfully populated database with languages, topics, questions, and tests!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
