import re
from typing import Dict, Any

def parse_natural_language_intent(prompt: str) -> Dict[str, Any]:
    """
    Parses a user's natural language request to identify:
    - language
    - topic
    - difficulty
    - question_type
    - num_questions
    - duration_minutes
    """
    p = prompt.lower()
    
    # 1. Detect language / domain
    language = "python" # default
    if any(k in p for k in ["python", "py"]):
        language = "python"
    elif any(k in p for k in ["javascript", "js", "node"]):
        language = "javascript"
    elif any(k in p for k in ["typescript", "ts"]):
        language = "typescript"
    elif any(k in p for k in ["c++", "cpp"]):
        language = "cpp"
    elif re.search(r"\bc\b", p) or " c " in p or p.startswith("c "):
        language = "c"
    elif any(k in p for k in ["java\b", "java "]) or "java" in p and "script" not in p:
        language = "java"
    elif any(k in p for k in ["c#", "csharp"]):
        language = "csharp"
    elif any(k in p for k in ["golang", " go "]) or p.startswith("go "):
        language = "go"
    elif "rust" in p:
        language = "rust"
    elif "sql" in p or "database" in p or "query" in p or "join" in p:
        language = "sql"
    elif any(k in p for k in ["dsa", "data structures", "algorithm"]):
        language = "dsa"
    elif any(k in p for k in ["machine learning", "ml", "ai", "deep learning", "nlp", "computer vision"]):
        language = "ai_ml"

    # 2. Detect topic
    topic = "fundamentals"
    topic_keywords = {
        "loop": "loops",
        "for loop": "loops",
        "while": "loops",
        "array": "arrays",
        "string": "strings",
        "function": "functions",
        "recursion": "recursion",
        "pointer": "pointers",
        "oop": "oop",
        "class": "oop",
        "inheritance": "oop",
        "polymorphism": "oop",
        "linked list": "linked-lists",
        "stack": "stack",
        "queue": "queue",
        "tree": "trees",
        "bst": "trees",
        "graph": "graphs",
        "dp": "dynamic-programming",
        "dynamic programming": "dynamic-programming",
        "sort": "sorting",
        "search": "searching",
        "binary search": "searching",
        "hash": "hashing",
        "dict": "dictionaries",
        "list": "lists",
        "tuple": "tuples",
        "exception": "exception-handling",
        "file": "file-handling",
        "join": "joins",
        "group by": "aggregation",
        "classification": "classification",
        "regression": "regression",
        "neural": "neural-networks"
    }
    for kw, top in topic_keywords.items():
        if kw in p:
            topic = top
            break

    # 3. Detect difficulty
    difficulty = "easy"
    if any(k in p for k in ["hard", "difficult", "expert", "advanced"]):
        difficulty = "hard"
    elif any(k in p for k in ["medium", "intermediate"]):
        difficulty = "medium"
    elif any(k in p for k in ["easy", "beginner", "basic", "fundamental"]):
        difficulty = "easy"

    # 4. Detect question type
    question_type = "coding"
    if any(k in p for k in ["mcq", "multiple choice", "quiz"]):
        question_type = "mcq"
    elif any(k in p for k in ["output", "predict output", "what is the output"]):
        question_type = "output_prediction"
    elif any(k in p for k in ["debug", "fix bug", "debugging"]):
        question_type = "debugging"
    elif any(k in p for k in ["interview", "interview question", "behavioral"]):
        question_type = "interview"
    elif any(k in p for k in ["concept", "explain", "difference between", "theoretical", "theory"]):
        question_type = "conceptual"
    elif any(k in p for k in ["machine learning", "ml", "ai"]) and not any(k in p for k in ["code", "coding", "program"]):
        question_type = "conceptual"

    # 5. Detect number of questions (e.g. '5 questions', '5 Java OOP questions', '10 problems')
    num_match = re.search(r"\b(\d+)\s+(?:[a-zA-Z0-9_#+/\-]+\s+){0,3}(?:questions?|problems?|mcqs?|challenges?)\b", p)
    if not num_match:
        num_match = re.search(r"\b(\d+)\s*(?:questions?|problems?|mcqs?)\b", p)
    num_questions = int(num_match.group(1)) if num_match else 1
    if num_questions > 20:
        num_questions = 20

    # 6. Detect duration
    dur_match = re.search(r"(\d+)\s*(?:minutes?|mins?|m)\b", p)
    duration_minutes = int(dur_match.group(1)) if dur_match else 30

    return {
        "language": language,
        "topic": topic,
        "difficulty": difficulty,
        "question_type": question_type,
        "num_questions": num_questions,
        "duration_minutes": duration_minutes,
        "is_test_request": any(k in p for k in ["test", "assessment", "exam", "quiz"]) and num_questions > 1
    }
