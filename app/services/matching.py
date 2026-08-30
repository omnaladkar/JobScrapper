"""Job matching engine: computes a 0-100 score with a weighted breakdown."""

from typing import List, Tuple

DEFAULT_PROFILE = {
    "target_roles": [
        "Backend Engineer", "Software Engineer", "Java Developer",
        "Java Backend Developer", "Spring Boot Developer",
        "Software Development Engineer", "Backend Software Engineer",
    ],
    "skills": [
        "java", "spring boot", "microservices", "kafka", "redis",
        "postgresql", "mysql", "aws", "docker", "sql",
        "javascript", "typescript", "c++",
    ],
    "experience_years": 2,
    "target_salary_min_lpa": 12,
    "preferred_locations": ["bangalore", "bengaluru", "hyderabad", "pune", "mumbai", "noida", "remote"],
    "company_priorities": ["product", "startup", "high-growth"],
}

# weight fractions must sum to 1.0
WEIGHTS = {
    "role": 0.25,
    "skills": 0.30,
    "experience": 0.15,
    "location": 0.15,
    "company": 0.10,
    "salary": 0.05,
}

SENIORITY_BLOCK = [
    "senior", "sr.", "staff", "principal", "director", "lead",
    "architect", "head", "manager", "vp", "vice president",
]
EXPERIENCE_BLOCK = ["intern", "trainee", "fresher"]


def _norm(s: str) -> str:
    return (s or "").lower()


def _contains_any(text: str, items: List[str]) -> Tuple[bool, List[str]]:
    hits = [i for i in items if i and i.lower() in text.lower()]
    return bool(hits), hits


def role_score(title: str, target_roles: List[str]) -> Tuple[float, List[str]]:
    t = _norm(title)
    reasons = []
    if not t:
        return 0.0, reasons
    if any(k in t for k in SENIORITY_BLOCK):
        return 15.0, ["Title looks senior for target level"]
    if any(k in t for k in EXPERIENCE_BLOCK):
        return 15.0, ["Title is intern/fresher level"]
    backend = any(k in t for k in ["backend", "back-end", "back end", "java", "spring"])
    score = 100.0 if backend else 70.0
    for role in target_roles:
        r = _norm(role)
        if r and (r in t or t in r):
            score = 100.0
            reasons.append(f"Title matches target role: {role}")
            break
    reasons.append("Backend/full-stack engineering title")
    return score, reasons


def skills_score(desc_text: str, skills: List[str]) -> Tuple[float, List[str], List[str]]:
    text = _norm(desc_text)
    matched, missing = [], []
    for skill in skills:
        if skill.lower() in text:
            matched.append(skill)
        elif skill.lower() in ["kubernetes", "grpc", "go", "python", "react"]:
            missing.append(skill)
    if not matched:
        return 0.0, matched, missing
    score = min(100.0, 40 + (len(matched) * 12))
    return score, matched, missing


def experience_score(profile_years: float, job_experience: str) -> Tuple[float, List[str]]:
    if not job_experience:
        return 100.0, ["No explicit experience requirement found"]
    text = _norm(job_experience)
    reasons = []
    # common patterns: "2-4 years", "2+ years", "minimum 3 years"
    import re
    m = re.search(r"(\d+)\s*(?:\+|to|-|\s*[-–])?\s*(\d+)?\s*(?:years|yrs|yr)", text)
    if not m:
        return 80.0, [f"Could not parse experience range ({job_experience})"]
    low = int(m.group(1))
    high = int(m.group(2)) if m.group(2) else low
    if profile_years < low:
        score = max(10.0, 100 - (low - profile_years) * 25)
        reasons.append(f"Requires {low}+ yrs, profile has {profile_years:.0f}")
    elif low <= profile_years <= high or profile_years <= high:
        score = 100.0
        reasons.append(f"Experience {low}-{high} yrs fits profile ({profile_years:.0f})")
    else:
        score = 70.0
        reasons.append(f"At/above upper bound {high} yrs")
    return score, reasons


def location_score(location: str, preferred: List[str]) -> Tuple[float, List[str]]:
    loc = _norm(location)
    if not loc:
        return 80.0, ["Location not specified"]
    if "remote" in loc:
        return 100.0, ["Remote role"]
    if "india" not in loc:
        return 30.0, ["Not India - outside preferred geography"]
    for city in preferred:
        c = city.lower()
        if c == "bangalore" or c == "bengaluru":
            if "bangalore" in loc or "bengaluru" in loc:
                return 100.0, ["Preferred location: Bangalore/Bengaluru"]
        if c in loc:
            return 100.0, [f"Preferred location: {city.title()}"]
    return 60.0, [f"India role but city not in preferred list ({location})"]


def company_score(company: str, priorities: List[str]) -> Tuple[float, List[str]]:
    c = _norm(company)
    if not c:
        return 70.0, []
    if any(k in c for k in ["amazon", "microsoft", "google", "meta", "uber", "databricks", "stripe"]):
        return 100.0, ["Large product/tech company"]
    return 75.0, ["Company noted"]  # default; product/startup flag handled if available


def salary_score(salary_text: str, min_lpa: float) -> Tuple[float, List[str]]:
    if not salary_text:
        return 75.0, ["Salary not listed - assume negotiable"]
    text = _norm(salary_text)
    import re
    amounts = re.findall(r"(\d+(?:\.\d+)?)\s*(?:lpa|lakh)", text)
    if not amounts:
        return 75.0, [f"Could not parse salary ({salary_text})"]
    try:
        max_amount = max(float(a) for a in amounts)
    except ValueError:
        return 75.0, ["Unparseable salary"]
    if max_amount >= min_lpa:
        return 100.0, [f"Salary {max_amount:.0f} LPA meets minimum {min_lpa:.0f}"]
    return 35.0, [f"Salary {max_amount:.0f} LPA below minimum {min_lpa:.0f}"]


def recommendation_for(score: float) -> str:
    if score >= 80:
        return "APPLY"
    if score >= 55:
        return "CONSIDER"
    return "LOW_PRIORITY"


def compute_match(job: dict, profile: dict) -> dict:
    role, role_reasons = role_score(job.get("role", ""), profile["target_roles"])
    skills, matched, missing = skills_score(
        (job.get("role", "") + " " + job.get("description", "")), profile["skills"]
    )
    exp, exp_reasons = experience_score(profile["experience_years"], job.get("experience", ""))
    loc, loc_reasons = location_score(job.get("location", ""), profile["preferred_locations"])
    comp, comp_reasons = company_score(job.get("company", ""), profile["company_priorities"])
    salary, sal_reasons = salary_score(job.get("salary", ""), profile["target_salary_min_lpa"])

    score = (
        role * WEIGHTS["role"]
        + skills * WEIGHTS["skills"]
        + exp * WEIGHTS["experience"]
        + loc * WEIGHTS["location"]
        + comp * WEIGHTS["company"]
        + salary * WEIGHTS["salary"]
    )
    score = round(min(max(score, 0.0), 100.0), 1)

    reasons = []
    reasons += role_reasons
    if matched:
        reasons.append("Skills found: " + ", ".join(matched[:6]))
    reasons += exp_reasons[:1]
    reasons += loc_reasons[:1]

    return {
        "score": score,
        "skills_score": round(skills, 1),
        "experience_score": round(exp, 1),
        "role_score": round(role, 1),
        "location_score": round(loc, 1),
        "salary_score": round(salary, 1),
        "company_score": round(comp, 1),
        "matched_skills": matched,
        "missing_skills": missing,
        "reasons": reasons,
        "recommendation": recommendation_for(score),
    }
