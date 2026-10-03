import logging
from typing import List, Dict, Any, Tuple
from app.execution.runner import execution_service

logger = logging.getLogger(__name__)

class TestCaseValidator:
    """
    Validates test cases and executes reference solutions to compute
    or verify expected outputs, preventing invalid AI test cases.
    """

    @staticmethod
    def normalize_output(text: str) -> str:
        """Strip trailing whitespace and carriage returns for clean comparison"""
        if not text:
            return ""
        lines = [line.rstrip() for line in text.replace("\r\n", "\n").split("\n")]
        # Remove trailing empty lines
        while lines and not lines[-1]:
            lines.pop()
        return "\n".join(lines)

    @classmethod
    def validate_and_refine_test_cases(
        cls,
        language: str,
        reference_solution: str,
        raw_test_cases: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Validates a list of test cases against a reference solution.
        Returns:
            (valid_test_cases, errors_or_warnings)
        """
        valid_cases = []
        logs = []
        seen_inputs = set()

        if not raw_test_cases:
            return [], ["No test cases provided."]

        # Check if reference solution exists
        has_ref = bool(reference_solution and reference_solution.strip())

        for idx, tc in enumerate(raw_test_cases):
            input_val = str(tc.get("input", "")).replace("\r\n", "\n")
            expected_val = str(tc.get("expected_output", "")).replace("\r\n", "\n")
            is_hidden = bool(tc.get("is_hidden", False))

            # Rule 4: Check duplicate test cases
            norm_input = input_val.strip()
            if norm_input in seen_inputs:
                logs.append(f"Skipping duplicate test case #{idx+1} with input: {norm_input[:30]}...")
                continue
            seen_inputs.add(norm_input)

            # Rule 6 & 7: If reference solution is provided, execute it with the input
            if has_ref and language.lower() in ["python", "python3"]:
                run_res = execution_service.run_code(
                    code=reference_solution,
                    language=language,
                    input_data=input_val,
                    timeout=4
                )

                if run_res.is_success:
                    computed_output = run_res.stdout
                    norm_computed = cls.normalize_output(computed_output)
                    norm_expected = cls.normalize_output(expected_val)

                    if norm_expected and norm_computed != norm_expected:
                        logs.append(
                            f"Test case #{idx+1}: AI expected '{norm_expected[:25]}' but reference solution produced '{norm_computed[:25]}'. Using verified reference output."
                        )
                    # Use the reference solution's actual output for guaranteed judge correctness!
                    expected_val = computed_output
                else:
                    logs.append(f"Test case #{idx+1} caused reference solution error: {run_res.stderr[:60]}")
                    # If reference solution crashes on this input, it might be an invalid boundary test case
                    continue

            valid_cases.append({
                "input_data": input_val,
                "expected_output": expected_val,
                "is_hidden": is_hidden,
                "is_sample": not is_hidden,
                "points": 10
            })

        return valid_cases, logs

test_case_validator = TestCaseValidator()
