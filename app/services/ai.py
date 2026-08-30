"""AIService abstraction. Allows swapping LLM providers without touching callers."""

from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Optional dependencies loaded lazily so the app runs without an LLM key.
from app.config import AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL


class AIError(Exception):
    pass


class AIService:
    """Interface for AI-powered helpers."""

    def generate_message(self, *, recipient_name, recipient_role, company,
                         job_role, profile):  # pragma: no cover - interface
        raise NotImplementedError

    def analyze_resume_text(self, text):  # pragma: no cover - interface
        raise NotImplementedError


class NoopAIService(AIService):
    """Fallback when no provider is configured. Returns template-safe output."""

    def generate_message(self, *, recipient_name, recipient_role, company,
                         job_role, profile):
        name = recipient_name if recipient_name and recipient_name != "NOT FOUND" else "there"
        emp = profile.get("experience_years", 2)
        skills = ", ".join(profile.get("skills", [])[:4]) or "backend development"
        my_name = profile.get("name") or "Om"
        return (
            f"Hi {name},\n\n"
            f"I came across the {job_role} opening at {company} and noticed your "
            f"background as a {recipient_role}.\n\n"
            f"I have around {emp:.0f} years of experience working with {skills}, "
            f"and the role looks closely aligned with my experience.\n\n"
            f"Would you be comfortable referring me if you feel my profile is a fit?\n\n"
            f"Thanks,\n{my_name}"
        )

    def analyze_resume_text(self, text):
        from app.services.resume_service import extract_resume_structure
        return extract_resume_structure(text)


class GeminiService(AIService):
    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = GEMINI_MODEL):
        self.api_key = api_key
        self.model = model
        self.base = "https://generativelanguage.googleapis.com/v1beta"

    def _call(self, prompt: str, system: str = "") -> str:
        import requests
        content = []
        if system:
            content.append({"role": "system", "parts": [{"text": system}]})
        content.append({"role": "user", "parts": [{"text": prompt}]})
        resp = requests.post(
            f"{self.base}/models/{self.model}:generateContent?key={self.api_key}",
            json={"contents": content},
            timeout=60,
        )
        if resp.status_code != 200:
            raise AIError(f"Gemini {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            raise AIError("Gemini returned no text")

    def generate_message(self, *, recipient_name, recipient_role, company,
                         job_role, profile):
        emp = profile.get("experience_years", 2)
        skills = ", ".join(profile.get("skills", [])[:5])
        name = profile.get("name", "Om")
        system = (
            "You write short, natural, first-person LinkedIn messages. "
            "Never invent facts. Keep it under 120 words. No emojis, no hashtags."
        )
        prompt = (
            f"Write a LinkedIn referral request from {name} to {recipient_name}, "
            f"a {recipient_role} at {company}, about a {job_role} opening at {company}. "
            f"The sender has ~{emp:.0f} years experience in {skills}. Tone: warm but professional, "
            f"concise. Ask if they would be comfortable referring."
        )
        return self._call(prompt, system)

    def analyze_resume_text(self, text):
        from app.services.resume_service import extract_resume_structure
        base = extract_resume_structure(text)
        system = (
            "Extract structured resume fields as JSON. Only include fields present in the text. "
            "Do not invent. Return: name, skills[], technologies[], companies[], job_titles[], "
            "projects[], education[], achievements[], experience (free text)."
        )
        try:
            raw = self._call(f"Resume text:\n\n{text[:8000]}", system)
            import json, re
            m = re.search(r"\{.*\}", raw, re.S)
            if m:
                data = json.loads(m.group(0))
                for k in ("skills", "technologies", "companies", "job_titles", "projects", "education", "achievements"):
                    if isinstance(data.get(k), list):
                        base[k] = data[k]
                base["name"] = data.get("name", base["name"])
        except Exception:
            pass  # keep rule-based fallback
        return base


def get_ai_service() -> AIService:
    if AI_PROVIDER == "gemini" and GEMINI_API_KEY:
        return GeminiService()
    return NoopAIService()
