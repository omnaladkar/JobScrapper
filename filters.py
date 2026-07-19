import re
from config import CITIES, INCLUDE_KEYWORDS, EXCLUDE_KEYWORDS

EXPERIENCE_PATTERNS = [
    (r"(\d+)\+?\s*(?:years|yrs|yr)", True),
    (r"(\d+)\s*[-–to]+\s*(\d+)\s*(?:years|yrs|yr)", False),
]

ENGINEERING_TITLES = [
    "engineer", "developer", "sde", "swe",
    "technical", "technology", "architect",
    "platform", "infrastructure", "backend",
    "back-end", "back end", "microservice",
    "software", "java", "spring",
]


def match_location(location_text):
    if not location_text:
        return False
    lower = location_text.lower()
    return any(city.lower() in lower for city in CITIES)


def is_engineering_role(title):
    text = title.lower()
    for kw in ENGINEERING_TITLES:
        if kw in text:
            return True
    return False


def title_has_include_keyword(title):
    text = title.lower()
    for kw in INCLUDE_KEYWORDS:
        if kw in text:
            return True
    return False


def match_keywords(title, description=""):
    if title_has_include_keyword(title):
        return True
    if is_engineering_role(title):
        text = (title + " " + description).lower()
        for kw in INCLUDE_KEYWORDS:
            if kw in text:
                return True
    return False


def exclude_job(title, description=""):
    text = (title + " " + description).lower()
    for kw in EXCLUDE_KEYWORDS:
        if kw in text:
            return True
    return False


def match_experience(experience_text):
    if not experience_text:
        return True
    text = experience_text.lower()
    for pattern, is_single in EXPERIENCE_PATTERNS:
        m = re.search(pattern, text)
        if m:
            if is_single:
                years = int(m.group(1))
                if 1 <= years <= 4:
                    return True
            else:
                low = int(m.group(1))
                high = int(m.group(2))
                if low <= 4 and high >= 1:
                    return True
    return True


def calculate_match_score(title, location, description=""):
    score = 0
    text = (title + " " + description).lower()

    core_keywords = ["java", "spring boot", "springboot", "backend"]
    for kw in core_keywords:
        count = text.count(kw)
        score += min(count * 10, 30)

    bonus_keywords = ["microservice", "aws", "kafka", "rest api", "restapi"]
    for kw in bonus_keywords:
        if kw in text:
            score += 10

    if "software engineer" in text:
        score += 5

    if match_location(location):
        score += 15

    return min(score, 100)


def filter_jobs(jobs):
    for job in jobs:
        title = job.get("role", "")
        description = job.get("description", "")
        location = job.get("location", "")

        if exclude_job(title, description):
            continue
        if not match_keywords(title, description):
            continue
        if not match_location(location):
            continue

        job["match_score"] = calculate_match_score(title, location, description)
        yield job
