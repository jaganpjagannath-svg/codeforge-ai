from typing import Dict, Any, List

MOCK_QUESTIONS_DATABASE: List[Dict[str, Any]] = [
    {
        "title": "Reverse Words in a String",
        "language": "python",
        "topic": "strings",
        "difficulty": "easy",
        "question_type": "coding",
        "description": "Given an input string `s`, reverse the order of the words.\nA word is defined as a sequence of non-space characters. The words in `s` will be separated by at least one space.\nReturn a string of the words in reverse order concatenated by a single space, with no leading or trailing spaces.",
        "input_format": "A single line containing the string s.",
        "output_format": "A single line containing the words reversed and separated by a single space.",
        "constraints": "1 <= len(s) <= 10^4\ns contains English letters, digits, and spaces.",
        "starter_code": "def reverse_words(s: str) -> str:\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    import sys\n    input_data = sys.stdin.read().strip()\n    print(reverse_words(input_data))\n",
        "reference_solution": "def reverse_words(s: str) -> str:\n    return ' '.join(s.split()[::-1])\n\nif __name__ == '__main__':\n    import sys\n    input_data = sys.stdin.read().strip()\n    print(reverse_words(input_data))\n",
        "solution_explanation": "Splitting the string on whitespace automatically handles multiple contiguous spaces and strips leading/trailing spaces. Reversing the word list and joining with a single space produces the optimal result in O(N) time and O(N) space.",
        "hints": [
            "Hint 1: Notice that multiple spaces between words need to be compressed into a single space.",
            "Hint 2: In Python, `str.split()` without arguments splits on consecutive whitespace and trims outer spaces.",
            "Hint 3: You can reverse a list in Python using slicing `[::-1]` or `reversed()`.",
            "Hint 4: Finally, combine the reversed tokens using `' '.join(words)`.",
            "Hint 5: Full logic: `words = s.split(); return ' '.join(reversed(words))`"
        ],
        "test_cases": [
            {"input": "the sky is blue", "expected_output": "blue is sky the", "is_hidden": False, "explanation": "Basic sentence"},
            {"input": "  hello world  ", "expected_output": "world hello", "is_hidden": False, "explanation": "Leading and trailing spaces"},
            {"input": "a good   example", "expected_output": "example good a", "is_hidden": True, "explanation": "Multiple spaces between words"},
            {"input": "SingleWord", "expected_output": "SingleWord", "is_hidden": True, "explanation": "Single word case"}
        ]
    },
    {
        "title": "Sum of Even Numbers in a Range",
        "language": "python",
        "topic": "loops",
        "difficulty": "easy",
        "question_type": "coding",
        "description": "Write a program that takes two integers `start` and `end` from stdin (separated by a space or newline) and calculates the sum of all even integers between `start` and `end` inclusive.",
        "input_format": "Two integers: start and end.",
        "output_format": "A single integer representing the sum of all even numbers in [start, end].",
        "constraints": "-10^5 <= start <= end <= 10^5",
        "starter_code": "def sum_even_numbers(start: int, end: int) -> int:\n    # Your code here\n    return 0\n\nif __name__ == '__main__':\n    import sys\n    tokens = sys.stdin.read().split()\n    if tokens:\n        s, e = int(tokens[0]), int(tokens[1])\n        print(sum_even_numbers(s, e))\n",
        "reference_solution": "def sum_even_numbers(start: int, end: int) -> int:\n    total = 0\n    for n in range(start, end + 1):\n        if n % 2 == 0:\n            total += n\n    return total\n\nif __name__ == '__main__':\n    import sys\n    tokens = sys.stdin.read().split()\n    if tokens:\n        s, e = int(tokens[0]), int(tokens[1])\n        print(sum_even_numbers(s, e))\n",
        "solution_explanation": "Iterate from start to end with a for loop. Use the modulo operator `% 2 == 0` to check for even numbers and accumulate the sum.",
        "hints": [
            "Hint 1: A number `x` is even if `x % 2 == 0`.",
            "Hint 2: Remember that range(start, end + 1) includes `end`.",
            "Hint 3: Initialize a counter or accumulator `total = 0` before the loop.",
            "Hint 4: For O(1) time optimization, you can even use the arithmetic series formula for even numbers.",
            "Hint 5: In loop form: `for i in range(start, end + 1): if i % 2 == 0: total += i`"
        ],
        "test_cases": [
            {"input": "1 10", "expected_output": "30", "is_hidden": False, "explanation": "2+4+6+8+10 = 30"},
            {"input": "4 4", "expected_output": "4", "is_hidden": False, "explanation": "Single even number"},
            {"input": "5 7", "expected_output": "6", "is_hidden": True, "explanation": "Only 6 is even"},
            {"input": "-4 4", "expected_output": "0", "is_hidden": True, "explanation": "Symmetric negative and positive range"}
        ]
    },
    {
        "title": "Two Sum - Target Pair Indices",
        "language": "dsa",
        "topic": "arrays",
        "difficulty": "medium",
        "question_type": "coding",
        "description": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nReturn the answer formatted as two space-separated indices in ascending order.",
        "input_format": "Line 1: Target value\nLine 2: Array elements separated by spaces",
        "output_format": "Two space-separated indices 'i j' where i < j.",
        "constraints": "2 <= nums.length <= 10^5\n-10^9 <= nums[i], target <= 10^9",
        "starter_code": "def two_sum(nums, target):\n    # Write your solution here\n    return []\n\nif __name__ == '__main__':\n    import sys\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        target = int(lines[0].strip())\n        nums = list(map(int, lines[1].strip().split()))\n        res = two_sum(nums, target)\n        print(f\"{res[0]} {res[1]}\")\n",
        "reference_solution": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return sorted([seen[diff], i])\n        seen[num] = i\n    return []\n\nif __name__ == '__main__':\n    import sys\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        target = int(lines[0].strip())\n        nums = list(map(int, lines[1].strip().split()))\n        res = two_sum(nums, target)\n        print(f\"{res[0]} {res[1]}\")\n",
        "solution_explanation": "Using a Hash Map (dictionary), we record the value and its index as we iterate. For each element, we check if `target - num` already exists in the map. This achieves O(N) time and O(N) space, far superior to O(N^2) brute force.",
        "hints": [
            "Hint 1: Can you solve this faster than O(N^2) by trading space for time?",
            "Hint 2: What data structure provides O(1) average lookup time?",
            "Hint 3: Use a hash table to store numbers you have already visited and their indices.",
            "Hint 4: For each number `x`, check if `target - x` is already in your hash table.",
            "Hint 5: Map store: `seen[x] = index`. If `target - x in seen: return [seen[target - x], i]`"
        ],
        "test_cases": [
            {"input": "9\n2 7 11 15", "expected_output": "0 1", "is_hidden": False, "explanation": "2 + 7 = 9"},
            {"input": "6\n3 2 4", "expected_output": "1 2", "is_hidden": False, "explanation": "2 + 4 = 6"},
            {"input": "6\n3 3", "expected_output": "0 1", "is_hidden": True, "explanation": "Duplicate elements"},
            {"input": "0\n-3 4 3 90", "expected_output": "0 2", "is_hidden": True, "explanation": "Negative numbers"}
        ]
    },
    {
        "title": "Python List vs Tuple Immutability",
        "language": "python",
        "topic": "fundamentals",
        "difficulty": "easy",
        "question_type": "mcq",
        "description": "Which of the following statements correctly identifies the primary difference between a Python List and a Python Tuple?",
        "starter_code": None,
        "reference_solution": None,
        "solution_explanation": "Lists are mutable sequences (can be modified in-place with append, pop, etc.), whereas tuples are immutable (cannot be changed after creation).",
        "hints": [
            "Hint 1: Consider what happens when you call `.append()` on both."
        ],
        "test_cases": [],
        "options": [
            {"key": "A", "text": "Lists can only hold numbers, while Tuples can hold any data type.", "is_correct": False, "explanation": "Both lists and tuples can hold mixed types."},
            {"key": "B", "text": "Lists are mutable (can be changed), while Tuples are immutable (cannot be changed).", "is_correct": True, "explanation": "Correct! Immutability is the defining architectural distinction."},
            {"key": "C", "text": "Tuples use square brackets `[]` while lists use parentheses `()`.", "is_correct": False, "explanation": "Lists use `[]` and tuples use `()`."},
            {"key": "D", "text": "Lists are faster for iteration than tuples.", "is_correct": False, "explanation": "Tuples are actually slightly faster and use less memory."}
        ]
    }
]

def get_fallback_question(language: str = "python", topic: str = "loops", difficulty: str = "easy", question_type: str = "coding") -> Dict[str, Any]:
    # Match best question
    lang = language.lower()
    top = topic.lower()
    for q in MOCK_QUESTIONS_DATABASE:
        if q["language"] == lang and q["question_type"] == question_type:
            return q
    # Default match
    return MOCK_QUESTIONS_DATABASE[0]
