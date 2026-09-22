import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_permission
from app.config.database import get_db
from app.models.sales import Appointment, AppointmentStatus, BlockedDate
from app.schemas.sales import AppointmentAdminUpdate, AppointmentCreate, AppointmentOut

router = APIRouter(tags=["Appointments"])


@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    if db.query(BlockedDate).filter(BlockedDate.date == payload.appointment_date).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This date is not available for booking.")

    clash = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date == payload.appointment_date,
            Appointment.time_slot_start == payload.time_slot_start,
            Appointment.status.in_([AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED]),
        )
        .first()
    )
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "This time slot is already booked.")

    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(appointment_id: uuid.UUID, email: str, db: Session = Depends(get_db)):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.email == email)
        .first()
    )
    if not appointment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found.")
    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)
    return appointment


# ---------- Admin ----------

admin_router = APIRouter(prefix="/admin/appointments", tags=["Admin - Appointments"])


@admin_router.get("", response_model=List[AppointmentOut])
def admin_list_appointments(
    db: Session = Depends(get_db), _=Depends(require_permission("appointments.manage"))
):
    return db.query(Appointment).order_by(Appointment.appointment_date).all()


@admin_router.put("/{appointment_id}", response_model=AppointmentOut)
def admin_update_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentAdminUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("appointments.manage")),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment
