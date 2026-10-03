import logging
import sys
import json
from datetime import datetime

class StructuredJsonFormatter(logging.Formatter):
    """
    Formats log records as clean structured output without exposing secrets.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": "codeforge-ai",
            "logger": record.name,
            "message": record.getMessage()
        }

        # Extra structured attributes if provided
        for attr in ["endpoint", "method", "user_id", "status_code", "error_code"]:
            if hasattr(record, attr):
                log_entry[attr] = getattr(record, attr)

        if record.exc_info:
            log_entry["traceback"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

def setup_logger():
    logger = logging.getLogger("codeforge")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)

    return logger

app_logger = setup_logger()
