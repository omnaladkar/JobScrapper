"""Resume handling: extract text from PDFs and derive a structured profile."""

import re

from app.config import UPLOAD_DIR


def extract_pdf_text(file_path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(pages)


def extract_resume_structure(text: str) -> dict:
    """Rule-based extraction. Conservative - only returns what's found in the text."""
    t = text or ""
    skills_set = set()
    skill_markers = [
        "java", "spring boot", "spring", "microservices", "kafka", "redis",
        "postgresql", "postgres", "mysql", "aws", "docker", "sql", "javascript",
        "typescript", "c++", "kubernetes", "grpc", "git", "maven", "gradle",
        "jenkins", "ci/cd", "lambda", "sqs", "sns", "cognito", "step functions",
        "hibernate", "jpa", "node.js", "nodejs", "react", "rest api", "restful",
        "event-driven", "distributed system",
    ]
    lower = t.lower()
    for skill in skill_markers:
        s = skill.lower()
        if re.search(r"\b" + re.escape(s.replace("-", r"[-\s]")) + r"\b", lower):
            skills_set.add(skill if skill not in ("postgres",) else "PostgreSQL")

    name = ""
    # name is usually in first ~3 non-empty lines
    for line in t.splitlines()[0:3]:
        line = line.strip()
        if line and len(line) < 60 and not re.search(r"\d", line):
            name = line
            break

    companies = extract_list_under_header(t, ["experience", "work experience", "employment"])
    job_titles = extract_list_under_header(t, ["experience", "work experience"])

    projects = extract_list_under_header(t, ["projects", "project"])
    education = extract_list_under_header(t, ["education", "academics"])

    return {
        "name": name,
        "skills": sorted(skills_set),
        "technologies": sorted(skills_set),
        "companies": companies,
        "job_titles": job_titles,
        "projects": projects,
        "education": education,
        "achievements": [],
        "experience": t[:2000],
    }


KNOWN_SECTIONS = [
    "experience", "work experience", "employment", "education", "projects", "project",
    "skills", "achievements", "certification", "certifications", "summary", "about",
    "technologies", "technical skills", "languages", "contact", "objective", "awards",
]


def extract_list_under_header(text: str, headers) -> list:
    lines = text.splitlines()
    result = []
    capture = False
    for line in lines:
        ls = line.strip()
        if not ls:
            continue
        lower = ls.lower()
        if capture and any(h.lower() in lower for h in KNOWN_SECTIONS if len(h) > 3) \
                and not any(h.lower() in lower for h in headers):
            pass  # fallthrough only if a NEW known section starts
        if re.search(r"(?i)^\s*(" + "|".join(headers) + r")\s*:?\s*$", ls):
            capture = True
            continue
        if capture:
            if any(h.lower() in lower for h in KNOWN_SECTIONS) and not any(h.lower() in lower for h in headers):
                capture = False
                continue
            if ls and len(ls) < 200:
                result.append(ls)
    return result


def save_resume_upload(db, filename: str, file_bytes) -> "app.models.Resume":
    import uuid
    from app import models
    from app.services.profile_service import get_or_create_profile

    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    file_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{safe_name}"
    file_path.write_bytes(file_bytes)

    text = extract_pdf_text(str(file_path)) if filename.lower().endswith(".pdf") else file_bytes.decode("utf-8", "ignore")
    structure = extract_resume_structure(text)

    profile = get_or_create_profile(db)
    resume = models.Resume(
        profile_id=profile.id,
        filename=filename,
        file_path=str(file_path),
        raw_text=text,
        name=structure.get("name", ""),
        experience=structure.get("experience", ""),
        companies=structure.get("companies", []),
        job_titles=structure.get("job_titles", []),
        skills=structure.get("skills", []),
        technologies=structure.get("technologies", []),
        projects=structure.get("projects", []),
        education=structure.get("education", []),
        achievements=structure.get("achievements", []),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume
