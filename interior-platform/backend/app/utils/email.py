"""
Email abstraction. In development (EMAIL_BACKEND=console) it just logs to
stdout so you can develop without any provider configured. Switch to smtp
or sendgrid via the environment for production.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.settings import get_settings

logger = logging.getLogger("app.email")
settings = get_settings()


def send_email(to: str, subject: str, html_body: str) -> None:
    if settings.EMAIL_BACKEND == "console":
        logger.info("---- EMAIL (console backend) ----")
        logger.info("To: %s\nSubject: %s\n%s", to, subject, html_body)
        return

    if settings.EMAIL_BACKEND == "smtp":
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
        return

    if settings.EMAIL_BACKEND == "sendgrid":
        # Kept dependency-free unless actually used.
        import requests

        requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}"},
            json={
                "personalizations": [{"to": [{"email": to}]}],
                "from": {"email": settings.EMAIL_FROM},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_body}],
            },
            timeout=10,
        )
        return

    raise ValueError(f"Unknown EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
