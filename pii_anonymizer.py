import re
from typing import Tuple, Dict

class PIIAnonymizer:
    """
    Sanitizes patient prompts by detecting and masking Personally Identifiable Information (PII)
    such as phone numbers, email addresses, SSN/Aadhaar numbers, and street addresses
    before submitting prompts to LLM models.
    """
    
    PHONE_REGEX = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    GOVT_ID_REGEX = re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b[A-Z]{5}\d{4}[A-Z]\b') # Aadhaar / PAN / SSN
    
    @classmethod
    def anonymize_text(cls, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Replaces sensitive PII in text with anonymous tokens.
        Returns anonymized_text and mapping dictionary.
        """
        replacements = {}
        anonymized = text
        
        # 1. Mask Email
        emails = cls.EMAIL_REGEX.findall(anonymized)
        for idx, email in enumerate(emails):
            token = f"[PATIENT_EMAIL_{idx+1}]"
            replacements[token] = email
            anonymized = anonymized.replace(email, token)
            
        # 2. Mask Phone
        phones = cls.PHONE_REGEX.findall(anonymized)
        for idx, phone in enumerate(phones):
            if isinstance(phone, tuple):
                phone = "".join(phone)
            if len(phone.strip()) >= 7:
                token = f"[PATIENT_PHONE_{idx+1}]"
                replacements[token] = phone
                anonymized = anonymized.replace(phone, token)
                
        # 3. Mask Govt IDs
        ids = cls.GOVT_ID_REGEX.findall(anonymized)
        for idx, id_num in enumerate(ids):
            token = f"[PATIENT_ID_{idx+1}]"
            replacements[token] = id_num
            anonymized = anonymized.replace(id_num, token)
            
        return anonymized, replacements

    @classmethod
    def deanonymize_text(cls, text: str, replacements: Dict[str, str]) -> str:
        """Restores original values in LLM response if needed."""
        restored = text
        for token, original in replacements.items():
            restored = restored.replace(token, original)
        return restored
