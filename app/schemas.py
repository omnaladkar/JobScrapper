from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Profile ----------
class ProfileIn(BaseModel):
    name: Optional[str] = None
    target_roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[float] = None
    target_salary_min_lpa: Optional[float] = None
    preferred_locations: Optional[List[str]] = None
    company_priorities: Optional[List[str]] = None


class ProfileOut(ORMModel):
    id: int
    name: str
    target_roles: List[str]
    skills: List[str]
    experience_years: float
    target_salary_min_lpa: float
    preferred_locations: List[str]
    company_priorities: List[str]


# ---------- Resume ----------
class ResumeOut(ORMModel):
    id: int
    filename: str
    name: str
    experience: str
    companies: List[str]
    job_titles: List[str]
    skills: List[str]
    technologies: List[str]
    projects: List[str]
    education: List[str]
    achievements: List[str]
    uploaded_at: datetime


# ---------- Job ----------
class JobOut(ORMModel):
    id: int
    company: str
    role: str
    location: str
    experience: str
    posted_date: str
    description: str
    apply_url: str
    source: str
    salary: str
    is_manual: bool
    created_at: datetime
    match: Optional["JobMatchOut"] = None


class JobIn(BaseModel):
    company: str
    role: str
    location: str = ""
    experience: str = ""
    posted_date: str = ""
    description: str = ""
    apply_url: str
    source: str = "manual"
    salary: str = ""


class JobMatchOut(ORMModel):
    id: int
    score: float
    skills_score: float
    experience_score: float
    role_score: float
    location_score: float
    salary_score: float
    company_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    reasons: List[str]
    recommendation: str
    computed_at: Optional[datetime] = None


JobOut.model_rebuild()


# ---------- Contact ----------
class ContactOut(ORMModel):
    id: int
    job_id: int
    name: str
    role: str
    company: str
    contact_type: str
    profile_url: str
    source: str
    confidence: float
    relevance: float
    reason: str
    verified: bool


# ---------- Message ----------
class MessageOut(ORMModel):
    id: int
    contact_id: int
    job_id: int
    role: str
    body: str
    created_at: datetime


class GenerateMessageIn(BaseModel):
    role: str = "referral"  # referral | recruiter


# ---------- Application ----------
class ApplicationOut(ORMModel):
    id: int
    job_id: int
    status: str
    applied_date: Optional[datetime] = None
    recruiter_id: Optional[int] = None
    employee_id: Optional[int] = None
    notes: str
    response: str
    interview_date: Optional[datetime] = None
    next_followup: Optional[datetime] = None


class ApplicationIn(BaseModel):
    status: Optional[str] = None
    applied_date: Optional[datetime] = None
    recruiter_id: Optional[int] = None
    employee_id: Optional[int] = None
    notes: Optional[str] = None
    response: Optional[str] = None
    interview_date: Optional[datetime] = None
    next_followup: Optional[datetime] = None


ApplicationOut.model_rebuild()


# ---------- Notification ----------
class NotificationOut(ORMModel):
    id: int
    title: str
    body: str
    kind: str
    read: bool
    created_at: datetime


# ---------- Dashboard ----------
class StatsOut(BaseModel):
    jobs_found: int
    high_matches: int
    applications: int
    people_to_contact: int
    responses: int
    interviews: int
    offers: int


class TopJobOut(BaseModel):
    id: int
    company: str
    role: str
    score: float
    recommendation: str


class DashboardOut(BaseModel):
    stats: StatsOut
    top_jobs: List[TopJobOut]
    status_counts: dict


class SearchJobIn(BaseModel):
    query: str = ""
    locations: List[str] = []
    limit: int = 50
