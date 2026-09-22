import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class UserType(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    STAFF = "STAFF"  # admin-side users; specific role governs permissions


class StaffRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    DESIGNER = "DESIGNER"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    CONTENT_MANAGER = "CONTENT_MANAGER"


# Many-to-many: roles <-> permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class Permission(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "permissions"

    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g. "projects.manage"
    description = Column(String(255), nullable=True)


class Role(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "roles"

    name = Column(Enum(StaffRole), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")


class User(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    user_type = Column(Enum(UserType), nullable=False, default=UserType.CUSTOMER)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)  # only for STAFF
    role = relationship("Role")

    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)

    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires_at = Column(String(50), nullable=True)

    customer_profile = relationship(
        "CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def has_permission(self, code: str) -> bool:
        if self.user_type != UserType.STAFF or not self.role:
            return False
        if self.role.name == StaffRole.SUPER_ADMIN:
            return True
        return any(p.code == code for p in self.role.permissions)


class CustomerProfile(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "customer_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    user = relationship("User", back_populates="customer_profile")

    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    preferred_contact_method = Column(String(30), nullable=True)  # EMAIL | PHONE | WHATSAPP
    notes = Column(Text, nullable=True)  # internal notes, staff-visible only
