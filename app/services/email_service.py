"""Email sending over an abstraction.

Supports two real senders, selected by EMAIL_SENDER:
  - 'smtp'     : SMTP (e.g. Gmail via an App Password). Good deliverability, free,
                 sends from your own mailbox. Requires 2FA + App Password on Gmail.
  - 'sendgrid' : SendGrid Web API. Already used by the daily scraper. Needs a
                 verified From + API key.

Safety: EMAIL_DRY_RUN defaults to True, so nothing is actually sent until you opt in.
Emails only ever go to a discovered/verified address, never a fabricated one.
"""

import logging
import smtplib
import ssl
from email.message import EmailMessage

from app import config

logger = logging.getLogger("uvicorn.error")


def can_send() -> bool:
    """True if a real sender is configured and enabled (dry-run may still be on)."""
    return bool(config.EMAIL_SENDER and config.EMAIL_SENDER != "none") and (config.SMTP_USER or config.SENDGRID_API_KEY)


def _send_smtp(to: str, subject: str, body: str, reply_to: str = "") -> bool:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = config.EMAIL_FROM or config.SMTP_USER
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    context = ssl.create_default_context()
    if config.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, context=context, timeout=20) as server:
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=20) as server:
            server.ehlo()
            if server.has_extn("starttls"):
                server.starttls(context=context)
                server.ehlo()
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.send_message(msg)
    return True


def _send_sendgrid(to: str, subject: str, body: str) -> bool:
    import requests

    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": config.SENDGRID_FROM},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body}],
    }
    resp = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        json=payload,
        headers={"Authorization": f"Bearer {config.SENDGRID_API_KEY}"},
        timeout=20,
    )
    if resp.status_code >= 300:
        logger.warning("SendGrid error %s: %s", resp.status_code, resp.text[:300])
        return False
    return True


def send_email(to: str, subject: str, body: str, reply_to: str = "") -> bool:
    """Send an email. Returns True on success.

    Honors EMAIL_DRY_RUN: when dry-run, logs what would be sent and returns True
    without contacting the mail server.
    """
    if not to or "@" not in to:
        logger.warning("send_email skipped: no valid recipient (%r)", to)
        return False

    mode = config.EMAIL_SENDER or "none"
    if mode == "none":
        logger.warning("send_email: EMAIL_SENDER=none; nothing sent to %s", to)
        return False

    if config.EMAIL_DRY_RUN:
        logger.info("[DRY-RUN] Would send %r to %s\n---\n%s\n---", subject, to, body)
        return True

    try:
        if mode == "smtp":
            return _send_smtp(to, subject, body, reply_to)
        if mode == "sendgrid":
            return _send_sendgrid(to, subject, body)
    except Exception as exc:
        logger.error("send_email failed for %s: %s", to, exc)
        return False

    logger.warning("send_email: unknown EMAIL_SENDER=%r", mode)
    return False
