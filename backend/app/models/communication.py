import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Index, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import TimestampMixin, UUIDPKMixin
from app.config.database import Base


class Conversation(Base, UUIDPKMixin, TimestampMixin):
    """One conversation thread per project, between the customer and assigned staff."""
    __tablename__ = "conversations"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)

    project = relationship("Project")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "messages"

    __table_args__ = (Index("ix_messages_conversation", "conversation_id", "created_at"),)

    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    attachments = Column(JSON, default=list)  # list[str] storage keys
    is_read = Column(Boolean, default=False, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class NotificationType(str, enum.Enum):
    NEW_ENQUIRY = "NEW_ENQUIRY"
    APPOINTMENT_CONFIRMATION = "APPOINTMENT_CONFIRMATION"
    APPOINTMENT_CHANGE = "APPOINTMENT_CHANGE"
    QUOTE_UPDATE = "QUOTE_UPDATE"
    PROJECT_MILESTONE_UPDATE = "PROJECT_MILESTONE_UPDATE"
    NEW_DOCUMENT = "NEW_DOCUMENT"
    DESIGN_APPROVAL_REQUEST = "DESIGN_APPROVAL_REQUEST"
    NEW_MESSAGE = "NEW_MESSAGE"


class Notification(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "notifications"

    # The unread badge polls this constantly.
    __table_args__ = (Index("ix_notifications_user_unread", "user_id", "is_read", "created_at"),)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=True)
    link = Column(String(500), nullable=True)  # frontend deep-link, e.g. /dashboard/projects/{id}
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    user = relationship("User")
