from sqlalchemy import Column, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class AuditLog(Base, UUIDPKMixin, TimestampMixin):
    """Immutable trail of sensitive actions (who did what, to which record)."""
    __tablename__ = "audit_logs"

    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)          # e.g. "project.status_changed"
    entity_type = Column(String(100), nullable=False)     # e.g. "Project"
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    metadata_json = Column(JSON, default=dict)             # arbitrary before/after diff
    ip_address = Column(String(64), nullable=True)

    actor = relationship("User")
