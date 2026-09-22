from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_staff
from app.config.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.sales import Appointment, AppointmentStatus, Enquiry, EnquiryStatus, Quote, QuoteStatus
from app.models.user import User, UserType

router = APIRouter(prefix="/admin/dashboard", tags=["Admin - Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), _=Depends(get_current_staff)):
    today = date.today()
    week_ahead = today + timedelta(days=7)

    total_enquiries = db.query(Enquiry).count()
    new_enquiries = db.query(Enquiry).filter(Enquiry.status == EnquiryStatus.NEW).count()
    active_projects = db.query(Project).filter(Project.status != ProjectStatus.COMPLETED, Project.is_deleted.is_(False)).count()
    completed_projects = db.query(Project).filter(Project.status == ProjectStatus.COMPLETED).count()
    upcoming_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date.between(today, week_ahead),
            Appointment.status.in_([AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED]),
        )
        .count()
    )
    total_customers = db.query(User).filter(User.user_type == UserType.CUSTOMER).count()

    accepted_quotes_total = (
        db.query(Quote).filter(Quote.status == QuoteStatus.ACCEPTED).with_entities(Quote.total_amount).all()
    )
    quotation_summary = sum((q[0] or 0) for q in accepted_quotes_total)

    recent_enquiries = (
        db.query(Enquiry).order_by(Enquiry.created_at.desc()).limit(5).all()
    )

    return {
        "total_enquiries": total_enquiries,
        "new_enquiries": new_enquiries,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "upcoming_appointments": upcoming_appointments,
        "total_customers": total_customers,
        "accepted_quotation_total": quotation_summary,
        "recent_activity": [
            {
                "type": "enquiry",
                "id": e.id,
                "title": f"{e.name} — {e.enquiry_number}",
                "status": e.status,
                "created_at": e.created_at,
            }
            for e in recent_enquiries
        ],
    }
