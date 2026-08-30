from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship

from app.database import Base


class Profile(Base):
    """User's editable preference profile (linked 1-1 to a resume)."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), default="")
    target_roles = Column(JSON, default=list)          # list[str]
    skills = Column(JSON, default=list)                # list[str]
    experience_years = Column(Float, default=2)
    target_salary_min_lpa = Column(Float, default=12)
    preferred_locations = Column(JSON, default=list)   # list[str]
    company_priorities = Column(JSON, default=list)    # list[str]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resume = relationship("Resume", back_populates="profile", uselist=False)


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=True)
    filename = Column(String(300))
    file_path = Column(String(500))
    raw_text = Column(Text, default="")
    name = Column(String(200), default="")
    experience = Column(Text, default="")
    companies = Column(JSON, default=list)
    job_titles = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    technologies = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    education = Column(JSON, default=list)
    achievements = Column(JSON, default=list)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="resume")


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("apply_url", name="uq_job_apply_url"),)

    id = Column(Integer, primary_key=True)
    company = Column(String(200), index=True)
    role = Column(String(300), index=True)
    location = Column(String(300), index=True)
    experience = Column(String(100), default="")
    posted_date = Column(String(60), default="")
    description = Column(Text, default="")
    apply_url = Column(String(600), unique=True)
    source = Column(String(40), index=True)
    salary = Column(String(120), default="")
    is_manual = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    match = relationship("JobMatch", back_populates="job", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), unique=True)
    score = Column(Float, default=0)
    skills_score = Column(Float, default=0)
    experience_score = Column(Float, default=0)
    role_score = Column(Float, default=0)
    location_score = Column(Float, default=0)
    salary_score = Column(Float, default=0)
    company_score = Column(Float, default=0)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    reasons = Column(JSON, default=list)
    recommendation = Column(String(30), default="CONSIDER")  # APPLY | CONSIDER | LOW_PRIORITY
    computed_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="match")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True)
    name = Column(String(200), default="NOT FOUND")
    role = Column(String(200), default="")
    company = Column(String(200), default="")
    contact_type = Column(String(30), default="employee")  # recruiter | employee
    profile_url = Column(String(500), default="")
    source = Column(String(200), default="")
    confidence = Column(Float, default=0.0)
    relevance = Column(Float, default=0.0)
    reason = Column(Text, default="")
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="contact")

    job = relationship("Job")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    role = Column(String(30), default="referral")  # referral | recruiter
    body = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    contact = relationship("Contact", back_populates="messages")
    job = relationship("Job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True)
    status = Column(String(30), default="NEW", index=True)
    applied_date = Column(DateTime, nullable=True)
    recruiter_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    notes = Column(Text, default="")
    response = Column(Text, default="")
    interview_date = Column(DateTime, nullable=True)
    next_followup = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("Job", back_populates="applications")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    title = Column(String(300))
    body = Column(Text)
    kind = Column(String(30), default="dashboard")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True)
    query = Column(String(300))
    locations = Column(JSON, default=list)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
