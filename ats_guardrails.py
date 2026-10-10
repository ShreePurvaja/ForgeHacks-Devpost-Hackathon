import re
import logging
from typing import Tuple

logger = logging.getLogger("ATSGuardrails")

class ATSGuardrails:
    """
    Adversarial Threat Shield (ATS) Guardrails for Hospital-OS.
    - Inspects incoming prompts for SQL Injection (SQLi) patterns.
    - Inspects incoming prompts for Prompt Injection & LLM Jailbreak patterns.
    """

    # SQL Injection Patterns
    SQLI_PATTERNS = [
        r"(?i)\bUNION\b\s+\bSELECT\b",
        r"(?i)OR\s+['\"]?1['\"]?\s*=\s*['\"]?1['\"]?",
        r"(?i)OR\s+['\"]?a['\"]?\s*=\s*['\"]?a['\"]?",
        r"(?i);\s*DROP\s+TABLE",
        r"(?i);\s*DELETE\s+FROM",
        r"(?i);\s*INSERT\s+INTO",
        r"(?i);\s*UPDATE\s+",
        r"(?i)INFORMATION_SCHEMA",
        r"(?i)xp_cmdshell",
        r"(?i)\bBENCHMARK\s*\(",
        r"(?i)\bSLEEP\s*\("
    ]

    # Prompt Injection & Jailbreak Patterns
    PROMPT_INJECTION_PATTERNS = [
        r"(?i)ignore\s+previous\s+instructions",
        r"(?i)ignore\s+all\s+prior\s+instructions",
        r"(?i)forget\s+all\s+rules",
        r"(?i)disregard\s+all\s+system\s+prompts",
        r"(?i)system\s+prompt\s*:",
        r"(?i)system\s+instructions\s*:",
        r"(?i)you\s+are\s+now\s+in\s+dan\s+mode",
        r"(?i)developer\s+mode\s+on",
        r"(?i)bypass\s+safety\s+filters",
        r"(?i)override\s+system\s+guardrails",
        r"(?i)jailbreak\s+mode"
    ]

    @classmethod
    def inspect_prompt(cls, prompt: str) -> Tuple[bool, str, str]:
        """
        Inspects prompt for security threats.
        Returns: (is_threat: bool, threat_type: str, reason: str)
        """
        if not prompt or not prompt.strip():
            return False, "NONE", ""

        # 1. SQL Injection Check
        for pattern in cls.SQLI_PATTERNS:
            if re.search(pattern, prompt):
                logger.warning(f"🛡️ [ATS GUARDRAIL ALERT] SQL Injection payload blocked: {pattern}")
                return True, "SQL_INJECTION", f"SQL Injection pattern detected: '{pattern}'"

        # 2. Prompt Injection Check
        for pattern in cls.PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, prompt):
                logger.warning(f"🛡️ [ATS GUARDRAIL ALERT] Prompt Injection jailbreak blocked: {pattern}")
                return True, "PROMPT_INJECTION", f"Prompt Injection pattern detected: '{pattern}'"

        return False, "NONE", ""
