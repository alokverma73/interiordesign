import datetime
import uuid
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.models.sales import AppointmentStatus, BudgetRange, EnquiryStatus


class EnquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: Optional[str] = None
    property_type: Optional[str] = None
    size_bhk: Optional[str] = None
    area_sqft: Optional[int] = None
    service_id: Optional[uuid.UUID] = None
    budget_range: BudgetRange = BudgetRange.NOT_SURE
    preferred_style: Optional[str] = None
    expected_start_date: Optional[datetime.date] = None
    description: Optional[str] = None
    reference_files: List[str] = []
    preferred_contact_method: str = "EMAIL"


class EnquiryOut(BaseModel):
    id: uuid.UUID
    enquiry_number: str
    name: str
    email: EmailStr
    phone: str
    status: EnquiryStatus
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class EnquiryAdminUpdate(BaseModel):
    status: Optional[EnquiryStatus] = None
    assigned_to_id: Optional[uuid.UUID] = None
    note: Optional[str] = None  # appended to internal_notes


class AppointmentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    service_id: Optional[uuid.UUID] = None
    appointment_date: datetime.date
    time_slot_start: datetime.time
    time_slot_end: datetime.time
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    appointment_date: datetime.date
    time_slot_start: datetime.time
    time_slot_end: datetime.time
    status: AppointmentStatus

    model_config = {"from_attributes": True}


class AppointmentAdminUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    appointment_date: Optional[datetime.date] = None
    time_slot_start: Optional[datetime.time] = None
    time_slot_end: Optional[datetime.time] = None
