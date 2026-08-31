from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import contact_service, message_service, email_service

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


class ContactIn(BaseModel):
    name: str
    role: str = ""
    company: str = ""
    contact_type: str = "employee"
    profile_url: str = ""
    source: str = "manual"
    confidence: float = 0.8
    relevance: float = 0.0
    reason: str = ""
    verified: bool = True


class SendIn(BaseModel):
    role: str = "referral"  # referral | recruiter
    to: str = ""            # optional override; defaults to contact's discovered email
    subject: str = ""


@router.get("/job/{job_id}", response_model=list[schemas.ContactOut])
def list_for_job(job_id: int, db: Session = Depends(get_db)):
    return db.query(models.Contact).filter(models.Contact.job_id == job_id).all()


@router.post("/job/{job_id}", response_model=schemas.ContactOut, status_code=201)
def add(job_id: int, data: ContactIn, db: Session = Depends(get_db)):
    row = contact_service.add_contact(db, job_id, data.model_dump())
    return row


@router.post("/{contact_id}/message", response_model=schemas.MessageOut)
def generate_message(contact_id: int, data: schemas.GenerateMessageIn, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(404, "Contact not found")
    msg = message_service.generate_for_contact(db, contact, data.role)
    return msg


@router.get("/{contact_id}/message", response_model=list[schemas.MessageOut])
def list_messages(contact_id: int, db: Session = Depends(get_db)):
    return db.query(models.Message).filter(models.Message.contact_id == contact_id).all()


@router.post("/{contact_id}/send")
def send_message(contact_id: int, data: SendIn, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(404, "Contact not found")

    # Resolve recipient: explicit override, else the discovered email in profile_url
    to = (data.to or "").strip() or (contact.profile_url or "").strip()
    if "@" not in to:
        raise HTTPException(400, "No email address on this contact. Add one or pass 'to'.")

    msg = message_service.generate_for_contact(db, contact, data.role)
    subject = data.subject.strip() or (
        f"{contact.company} - {contact.role or 'Opportunity'}" if contact.company else "Job opportunity"
    )

    sender_ready = email_service.can_send()
    dry_run = email_service.config.EMAIL_DRY_RUN
    sent = email_service.send_email(to, subject, msg.body)

    return {
        "contact_id": contact.id,
        "to": to,
        "subject": subject,
        "sender_ready": sender_ready,
        "dry_run": dry_run,
        "sent": sent,
        "configured": email_service.config.EMAIL_SENDER or "none",
        "message_preview": msg.body[:200],
    }
