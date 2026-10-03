"""
Custom Application Exceptions with standardized error codes and HTTP status mapping.
"""

class AppException(Exception):
    def __init__(self, message: str, code: str = "APP_ERROR", status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class AuthenticationError(AppException):
    def __init__(self, message: str = "Incorrect email or password.", code: str = "INVALID_CREDENTIALS"):
        super().__init__(message=message, code=code, status_code=401)

class AuthorizationError(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action.", code: str = "FORBIDDEN"):
        super().__init__(message=message, code=code, status_code=403)

class ResourceNotFoundError(AppException):
    def __init__(self, message: str = "The requested resource was not found.", code: str = "NOT_FOUND"):
        super().__init__(message=message, code=code, status_code=404)

class ValidationError(AppException):
    def __init__(self, message: str = "Invalid input data provided.", code: str = "VALIDATION_ERROR", details: dict = None):
        super().__init__(message=message, code=code, status_code=400, details=details)

class SubmissionEligibilityError(AppException):
    def __init__(self, message: str = "All required public test cases must pass before submission.", code: str = "SUBMISSION_NOT_ELIGIBLE"):
        super().__init__(message=message, code=code, status_code=400)

class CodeExecutionError(AppException):
    def __init__(self, message: str = "Code execution encountered a runtime error.", code: str = "EXECUTION_ERROR"):
        super().__init__(message=message, code=code, status_code=400)

class AIServiceError(AppException):
    def __init__(self, message: str = "AI service temporarily unavailable. Please retry.", code: str = "AI_SERVICE_ERROR"):
        super().__init__(message=message, code=code, status_code=502)

class DatabaseError(AppException):
    def __init__(self, message: str = "Database operation failed. Please try again.", code: str = "DATABASE_ERROR"):
        super().__init__(message=message, code=code, status_code=503)
