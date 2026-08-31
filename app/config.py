import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"

DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATA_DIR / 'app.db'}")

AI_PROVIDER = os.environ.get("AI_PROVIDER", "none")  # none | gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

# Email sender config. EMAIL_SENDER is one of: none | smtp | sendgrid
EMAIL_SENDER = os.environ.get("EMAIL_SENDER", "none")  # safe default: do nothing
EMAIL_DRY_RUN = os.environ.get("EMAIL_DRY_RUN", "true").lower() == "true"

# SMTP (e.g. Gmail App Password)
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")          # your full email address
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")  # app password (never commit)
EMAIL_FROM = os.environ.get("EMAIL_FROM", SMTP_USER)

# SendGrid
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
SENDGRID_FROM = os.environ.get("SENDGRID_FROM", "")
