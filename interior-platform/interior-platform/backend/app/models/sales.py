import enum

from sqlalchemy import Boolean, Column, Date, Enum, ForeignKey, Index, Integer, JSON, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class EnquiryStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    CONSULTATION = "CONSULTATION"
    QUOTATION = "QUOTATION"
    NEGOTIATION = "NEGOTIATION"
    APPROVED = "APPROVED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BudgetRange(str, enum.Enum):
    UNDER_5L = "UNDER_5L"
    L5_10 = "5L_10L"
    L10_25 = "10L_25L"
    L25_50 = "25L_50L"
    ABOVE_50L = "ABOVE_50L"
    NOT_SURE = "NOT_SURE"


class Enquiry(Base, UUIDPKMixin, TimestampMixin):
    """Public quote/enquiry submissions. enquiry_number is the customer-facing tracking ID."""
    __tablename__ = "enquiries"

    # Admin list filters by status and sorts by date; tracking looks up number+email.
    __table_args__ = (
        Index("ix_enquiries_status_created", "status", "created_at"),
        Index("ix_enquiries_tracking", "enquiry_number", "email"),
        Index("ix_enquiries_assigned", "assigned_to_id", "status"),
    )

    enquiry_number = Column(String(20), unique=True, nullable=False, index=True)  # e.g. ENQ-2026-00042

    # Contact details (customer may or may not have an account yet)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(30), nullable=False)
    city = Column(String(100), nullable=True)

    property_type = Column(String(100), nullable=True)  # Apartment, Villa, Office...
    size_bhk = Column(String(50), nullable=True)
    area_sqft = Column(Integer, nullable=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    budget_range = Column(Enum(BudgetRange), default=BudgetRange.NOT_SURE)
    preferred_style = Column(String(150), nullable=True)
    expected_start_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    reference_files = Column(JSON, default=list)  # list[str] storage keys
    preferred_contact_method = Column(String(30), default="EMAIL")

    status = Column(Enum(EnquiryStatus), default=EnquiryStatus.NEW, nullable=False, index=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    internal_notes = Column(JSON, default=list)  # list[{author_id, note, created_at}]

    converted_project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)

    customer = relationship("User", foreign_keys=[customer_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    service = relationship("Service")
    quotes = relationship("Quote", back_populates="enquiry", cascade="all, delete-orphan")


class QuoteStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Quote(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "quotes"

    enquiry_id = Column(UUID(as_uuid=True), ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False)
    quote_number = Column(String(20), unique=True, nullable=False)
    line_items = Column(JSON, default=list)  # list[{description, amount}]
    total_amount = Column(Integer, nullable=True)  # stored in smallest currency unit (paise/cents)
    currency = Column(String(10), default="INR")
    valid_until = Column(Date, nullable=True)
    status = Column(Enum(QuoteStatus), default=QuoteStatus.DRAFT, nullable=False)
    document_url = Column(String(500), nullable=True)  # generated PDF quotation

    enquiry = relationship("Enquiry", back_populates="quotes")


class AppointmentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    CONFIRMED = "CONFIRMED"
    RESCHEDULED = "RESCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Appointment(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "appointments"

    # Slot-clash detection hits this on every booking attempt.
    __table_args__ = (
        Index("ix_appointments_slot", "appointment_date", "time_slot_start", "status"),
    )

    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    enquiry_id = Column(UUID(as_uuid=True), ForeignKey("enquiries.id"), nullable=True)

    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=False)

    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True)
    appointment_date = Column(Date, nullable=False)
    time_slot_start = Column(Time, nullable=False)
    time_slot_end = Column(Time, nullable=False)
    notes = Column(Text, nullable=True)

    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.REQUESTED, nullable=False)

    customer = relationship("User")
    enquiry = relationship("Enquiry")
    service = relationship("Service")


class BusinessHours(Base, UUIDPKMixin, TimestampMixin):
    """Weekly recurring working hours used to compute available slots."""
    __tablename__ = "business_hours"

    day_of_week = Column(Integer, nullable=False)  # 0=Monday ... 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, default=60)
    is_active = Column(Boolean, default=True, nullable=False)


class BlockedDate(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "blocked_dates"

    date = Column(Date, nullable=False, unique=True)
    reason = Column(String(255), nullable=True)
