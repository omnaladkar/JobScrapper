from sqlalchemy.orm import Session

from app import models

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
    "preferred_locations": [
        "Bangalore", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Noida", "Remote",
    ],
    "company_priorities": ["Product companies", "Startups", "High-growth technology"],
}


def get_or_create_profile(db: Session) -> models.Profile:
    profile = db.query(models.Profile).order_by(models.Profile.id.asc()).first()
    if not profile:
        profile = models.Profile(**DEFAULT_PROFILE)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def to_dict_with_defaults(profile: models.Profile) -> dict:
    d = DEFAULT_PROFILE.copy()
    for key in d:
        if key in ("name",) or key not in DEFAULT_PROFILE:
            continue
    return {
        "target_roles": profile.target_roles or d["target_roles"],
        "skills": profile.skills or d["skills"],
        "experience_years": profile.experience_years or d["experience_years"],
        "target_salary_min_lpa": profile.target_salary_min_lpa or d["target_salary_min_lpa"],
        "preferred_locations": profile.preferred_locations or d["preferred_locations"],
        "company_priorities": profile.company_priorities or d["company_priorities"],
        "name": profile.name or "",
    }


def get_active_profile_dict(db: Session = None) -> dict:
    if db is not None:
        return to_dict_with_defaults(get_or_create_profile(db))
    # Called without a DB session (e.g. from matching with no session) -> return defaults.
    return DEFAULT_PROFILE
