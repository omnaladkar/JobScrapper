"""Safe contact discovery (Phase 4).

Scans the PUBLIC job posting page (which we already fetch while scraping) for an
actual hiring contact: a named recruiter, an email/mailto link, or an explicit
'hiring manager / meet the team / recruiter' reference in the HTML.

Safety rules:
  - We NEVER touch the user's (or anyone's) LinkedIn account. No logins, no
    authenticated requests, no browser automation that could get an account banned.
  - We only read the public ATS/careers page for the job.
  - A contact is only 'found' when there is concrete evidence in that public page.
  - Otherwise we return NOT FOUND with confidence 0.0 (never fabricate a person).
"""

import re
import urllib.request

_RECRUITER_HINTS = re.compile(
    r"(recruiter|talent\s*(acquisition|partner)|people\s*ops|hiring\s*(manager|partner)|"
    r"talent\s*partner|hr\s*manager|technical\s*recruiter)",
    re.IGNORECASE,
)


def fetch_job_page(apply_url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(
        apply_url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def _heuristic_name(fragment: str) -> str:
    """Pull a plausible person name from a text fragment (First Last or F. Last)."""
    fragment = fragment.strip(" :;,")
    if not fragment or len(fragment) > 60:
        return ""
    if re.search(r"\d", fragment):
        return ""
    words = [w for w in re.split(r"[\s]+", fragment) if w]
    words = [re.sub(r"[^A-Za-z'.-]", "", w) for w in words]
    words = [w for w in words if w]
    if not words:
        return ""
    # likely an email or URL
    if any(w.lower() in ("com", "org", "net", "in") for w in words):
        return ""
    if len(words) == 1 and words[0].isupper() and len(words[0]) <= 2:
        return ""
    # "Firstname Lastname" or "F. Lastname" or "Firstname L."
    cap = [w for w in words if w[:1].isupper()]
    if len(words) == 1:
        return " ".join(cap) if cap else ""
    if words[0][:1].isupper():
        return " ".join(words[:2])
    return ""


def discover_from_post(apply_url: str, company: str, job_role: str) -> list:
    """Return a list of candidate contacts (or empty) mined from the public posting."""
    results = []
    try:
        html = fetch_job_page(apply_url)
    except Exception:
        return results

    lower = html.lower()

    # 1) mailto links -> recruiter emails (strong evidence)
    emails = sorted(set(re.findall(r"mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})", lower)))
    recruit_mails = [e for e in emails if "apply" not in e and "jobs" not in e and "no-reply" not in e]
    for mail in recruit_mails:
        local = mail.split("@")[0].lower()
        # Generic/team inbox (candidates, careers, hr, talent, privacy, etc.) is a real
        # contact but NOT a named person - label it as the company's team, not a fake name.
        generic_tokens = {"candidates", "careers", "career", "hr", "jobs", "recruit", "recruiting",
                          "talent", "privacy", "contact", "info", "resume", "hiring", "team", "people"}
        toks = set(re.split(r"[._\-0-9]+", local)) - {""}
        has_generic = bool(toks & generic_tokens)
        if has_generic:
            name_hint = f"{(company or 'Company').title()} Talent Team"
            role_txt = "Recruiter (team inbox)"
            conf = 0.8
            reason = f"Found team recruiting inbox {mail} in the public job posting."
        else:
            name_hint = re.sub(r"[._-]+", " ", local).strip().title() or "Contact"
            role_txt = "Recruiter"
            conf = 0.9
            reason = f"Found recruiter email {mail} in the public job posting."
        results.append({
            "name": name_hint,
            "role": role_txt,
            "contact_type": "recruiter",
            "profile_url": mail if "@" in mail else "",
            "source": "public posting mailto",
            "confidence": conf,
            "relevance": 1.0,
            "reason": reason,
            "verified": True,
            "email": mail,
        })
        return results[:3]

    # 2) Named-title anchors: "<Name> - Job Title" near hiring keywords
    for m in re.finditer(r">\s*([A-Z][A-Za-z' .-]{2,40})\s*[-,|]\s*([^<]{2,40})<\s*/", html):
        name, role_hint = m.group(1).strip(), m.group(2).strip()
        if _RECRUITER_HINTS.search(role_hint) and _RECRUITER_HINTS.search(role_hint):
            nm = _heuristic_name(name)
            if nm:
                results.append({
                    "name": nm,
                    "role": role_hint.strip()[:120],
                    "contact_type": "recruiter",
                    "profile_url": "",
                    "source": "public posting name+title",
                    "confidence": 0.6,
                    "relevance": 1.0,
                    "reason": f"Found '{role_hint.strip()}' in posting with name {nm}.",
                    "verified": True,
                })

    # 3) "Hiring Manager / meet the team" text blocks mentioning a person
    if not results:
        for m in re.finditer(r"([A-Z][a-z]+(?:\s+[A-Z][A-Za-z'.-]+){1,3})\s*[,\-–]\s*([A-Za-z][^<\n]{2,50})", html):
            name, role_hint = m.group(1).strip(), m.group(2).strip()
            if _RECRUITER_HINTS.search(role_hint):
                nm = _heuristic_name(name)
                if nm and nm not in [r["name"] for r in results]:
                    results.append({
                        "name": nm,
                        "role": role_hint[:120],
                        "contact_type": "recruiter",
                        "profile_url": "",
                        "source": "public posting hiring-manager block",
                        "confidence": 0.5,
                        "relevance": 0.9,
                        "reason": f"Posting mentions {nm} as '{role_hint[:60]}'.",
                        "verified": True,
                    })

    # 4) Fallback: an employee role suggestion found when job description names a team lead
    if not results:
        names = re.findall(r"reporting to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})", lower)
        for nm in set(names):
            h = _heuristic_name(nm)
            if h:
                results.append({
                    "name": h,
                    "role": "Hiring Manager",
                    "contact_type": "employee",
                    "profile_url": "",
                    "source": "public posting reporting line",
                    "confidence": 0.5,
                    "relevance": 0.8,
                    "reason": f"Posting mentions {h} as the reporting manager.",
                    "verified": True,
                })

    return results[:3]
