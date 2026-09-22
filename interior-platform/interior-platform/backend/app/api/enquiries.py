import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_permission
from app.config.database import get_db
from app.models.communication import Notification, NotificationType
from app.models.sales import Enquiry, EnquiryStatus
from app.models.user import User, UserType
from app.schemas.sales import EnquiryAdminUpdate, EnquiryCreate, EnquiryOut
from app.utils.id_generator import generate_reference_number
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter(tags=["Enquiries"])


@router.post("/quote", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
def submit_enquiry(payload: EnquiryCreate, db: Session = Depends(get_db)):
    enquiry = Enquiry(
        enquiry_number=generate_reference_number("ENQ"),
        **payload.model_dump(),
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # Notify every staff member with lead-management permission (simplified: all staff/admins).
    staff = db.query(User).filter(User.user_type == UserType.STAFF, User.is_active.is_(True)).all()
    for member in staff:
        db.add(
            Notification(
                user_id=member.id,
                type=NotificationType.NEW_ENQUIRY,
                title="New enquiry received",
                body=f"{enquiry.name} submitted enquiry {enquiry.enquiry_number}.",
                link=f"/admin/enquiries/{enquiry.id}",
            )
        )
    db.commit()
    return enquiry


@router.get("/quote/track/{enquiry_number}", response_model=EnquiryOut)
def track_enquiry(enquiry_number: str, email: str, db: Session = Depends(get_db)):
    """Public tracking — requires both the enquiry number and the email used, to prevent enumeration."""
    enquiry = (
        db.query(Enquiry)
        .filter(Enquiry.enquiry_number == enquiry_number, Enquiry.email == email)
        .first()
    )
    if not enquiry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No enquiry found for those details.")
    return enquiry


@router.get("/dashboard/enquiries", response_model=List[EnquiryOut])
def my_enquiries(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Enquiry).filter(Enquiry.email == user.email).order_by(Enquiry.created_at.desc()).all()


# ---------- Admin ----------

admin_router = APIRouter(prefix="/admin/enquiries", tags=["Admin - Enquiries"])


@admin_router.get("", response_model=PaginatedResponse[EnquiryOut])
def admin_list_enquiries(
    status_filter: Optional[EnquiryStatus] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_permission("enquiries.manage")),
):
    query = db.query(Enquiry)
    if status_filter:
        query = query.filter(Enquiry.status == status_filter)
    query = query.order_by(Enquiry.created_at.desc())
    items, total, page, page_size, total_pages = paginate(query, page, page_size)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@admin_router.put("/{enquiry_id}", response_model=EnquiryOut)
def admin_update_enquiry(
    enquiry_id: uuid.UUID,
    payload: EnquiryAdminUpdate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_permission("enquiries.manage")),
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found.")

    if payload.status is not None:
        enquiry.status = payload.status
    if payload.assigned_to_id is not None:
        enquiry.assigned_to_id = payload.assigned_to_id
    if payload.note:
        notes = list(enquiry.internal_notes or [])
        notes.append(
            {"author_id": str(staff.id), "note": payload.note, "created_at": datetime.utcnow().isoformat()}
        )
        enquiry.internal_notes = notes

    db.commit()
    db.refresh(enquiry)
    return enquiry
