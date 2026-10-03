// Centralized Error Normalization Layer
// Guarantees [object Object], undefined, null, and raw tracebacks NEVER appear!

export function getErrorMessage(error) {
  if (!error) {
    return "An unexpected issue occurred. Please try again.";
  }

  // If already string
  if (typeof error === "string") {
    if (error === "[object Object]" || error === "undefined" || error === "null") {
      return "Unable to complete request. Please try again.";
    }
    return error;
  }

  // Handle standard CodeForge error response: { error: { code: '...', message: '...' } }
  if (error.error) {
    if (typeof error.error === "string") return error.error;
    if (error.error.message) return error.error.message;
  }

  // Handle FastAPI detail
  if (error.detail) {
    if (typeof error.detail === "string") return error.detail;
    if (Array.isArray(error.detail) && error.detail.length > 0) {
      const first = error.detail[0];
      return first.msg || first.message || "Invalid input provided.";
    }
  }

  // Handle standard JS Error object
  if (error.message && typeof error.message === "string") {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    if (error.message !== "[object Object]") {
      return error.message;
    }
  }

  return "Something went wrong. Please check your details and try again.";
}

export function validateEmail(email) {
  if (!email || !email.trim()) return "Email address is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must contain at least 8 characters.";
  return null;
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
