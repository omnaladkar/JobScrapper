"""Message generation for recruiters and employees via the AIService abstraction."""

from sqlalchemy.orm import Session

from app import models
from app.services.ai import get_ai_service
from app.services.profile_service import get_active_profile_dict


def generate_for_contact(db: Session, contact: models.Contact, msg_role: str = "referral") -> models.Message:
    job = db.query(models.Job).filter(models.Job.id == contact.job_id).first()
    profile = get_active_profile_dict(db)
    ai = get_ai_service()

    if msg_role == "recruiter":
        body = (
            f"Hi {contact.name if contact.name != 'NOT FOUND' else 'there'},\n\n"
            f"I came across the {job.role} opening at {job.company} and wanted to reach out "
            f"regarding the opportunity.\n\n"
            f"I have around {profile['experience_years']:.0f} years of backend development "
            f"experience with {', '.join(profile['skills'][:4])}, and the position looks closely "
            f"aligned with my background.\n\n"
            f"I've attached my resume for reference. I'd be happy to share any additional information "
            f"if needed.\n\nThanks,\n{profile.get('name') or 'Om'}"
        )
    else:
        body = ai.generate_message(
            recipient_name=contact.name,
            recipient_role=contact.role,
            company=job.company,
            job_role=job.role,
            profile=profile,
        )

    existing = (
        db.query(models.Message)
        .filter(models.Message.contact_id == contact.id, models.Message.role == msg_role)
        .first()
    )
    if existing:
        existing.body = body
        db.commit()
        db.refresh(existing)
        return existing

    msg = models.Message(
        contact_id=contact.id,
        job_id=contact.job_id,
        role=msg_role,
        body=body,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
