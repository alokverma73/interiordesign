import enum

from sqlalchemy import (
    Boolean, Column, Date, Enum, ForeignKey, Index, Integer, JSON, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin, UUIDPKMixin


class Service(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "services"

    __table_args__ = (
        Index("ix_services_active_order", "is_active", "is_deleted", "display_order"),
    )

    name = Column(String(150), nullable=False)
    slug = Column(String(180), unique=True, nullable=False, index=True)
    short_description = Column(String(300), nullable=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    gallery = Column(JSON, default=list)  # list[str] image urls
    features = Column(JSON, default=list)  # list[str]
    process_steps = Column(JSON, default=list)  # list[{title, description}]
    faqs = Column(JSON, default=list)  # list[{question, answer}]
    cta_label = Column(String(100), default="Request a Quote")

    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(300), nullable=True)

    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    projects = relationship("Project", secondary="project_services", back_populates="services")


class ProjectCategory(str, enum.Enum):
    RESIDENTIAL = "RESIDENTIAL"
    APARTMENT = "APARTMENT"
    VILLA = "VILLA"
    KITCHEN = "KITCHEN"
    BEDROOM = "BEDROOM"
    LIVING_ROOM = "LIVING_ROOM"
    OFFICE = "OFFICE"
    COMMERCIAL = "COMMERCIAL"
    RETAIL = "RETAIL"
    EXTERIOR = "EXTERIOR"


class ProjectStatus(str, enum.Enum):
    CONSULTATION = "CONSULTATION"
    PLANNING = "PLANNING"
    CONCEPT = "CONCEPT"
    DESIGN = "DESIGN"
    VISUALIZATION = "VISUALIZATION"
    APPROVAL = "APPROVAL"
    PROCUREMENT = "PROCUREMENT"
    EXECUTION = "EXECUTION"
    INSTALLATION = "INSTALLATION"
    HANDOVER = "HANDOVER"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"


# Association table: Project <-> Service (a project can use multiple services)
from sqlalchemy import Table  # noqa: E402

project_services = Table(
    "project_services",
    Base.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    # The public portfolio always filters on (is_published, is_deleted) and then
    # narrows by category or featured, so these composites keep it index-only.
    __table_args__ = (
        Index("ix_projects_public_listing", "is_published", "is_deleted", "category"),
        Index("ix_projects_featured", "is_published", "is_featured"),
        Index("ix_projects_customer", "customer_id", "is_deleted"),
    )

    name = Column(String(200), nullable=False)
    slug = Column(String(220), unique=True, nullable=False, index=True)
    category = Column(Enum(ProjectCategory), nullable=False)
    location = Column(String(150), nullable=True)
    client_type = Column(String(100), nullable=True)  # e.g. "Individual Homeowner", "Corporate"
    completion_date = Column(Date, nullable=True)
    area_sqft = Column(Integer, nullable=True)

    description = Column(Text, nullable=True)
    design_concept = Column(Text, nullable=True)
    materials_used = Column(JSON, default=list)  # list[str]

    cover_image_url = Column(String(500), nullable=True)
    gallery = Column(JSON, default=list)  # list[str]
    before_after_images = Column(JSON, default=list)  # list[{before, after, label}]

    is_featured = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)

    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(300), nullable=True)

    # Live/operational project status (drives the customer portal timeline)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.CONSULTATION, nullable=False)
    start_date = Column(Date, nullable=True)
    expected_completion_date = Column(Date, nullable=True)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    customer = relationship("User", foreign_keys=[customer_id])

    services = relationship("Service", secondary=project_services, back_populates="projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship(
        "ProjectMilestone", back_populates="project", cascade="all, delete-orphan",
        order_by="ProjectMilestone.sort_order",
    )
    updates = relationship(
        "ProjectUpdate", back_populates="project", cascade="all, delete-orphan",
        order_by="ProjectUpdate.created_at.desc()",
    )
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    design_proposals = relationship(
        "DesignProposal", back_populates="project", cascade="all, delete-orphan",
        order_by="DesignProposal.version.desc()",
    )


class ProjectMemberRole(str, enum.Enum):
    DESIGNER = "DESIGNER"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    OBSERVER = "OBSERVER"


class ProjectMember(Base, UUIDPKMixin, TimestampMixin):
    """Staff assigned to a project (designer, PM, etc.)."""
    __tablename__ = "project_members"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ProjectMemberRole), nullable=False, default=ProjectMemberRole.DESIGNER)

    project = relationship("Project", back_populates="members")
    user = relationship("User")


class ProjectMilestone(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "project_milestones"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), nullable=False)
    sort_order = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)

    project = relationship("Project", back_populates="milestones")


class ProjectUpdate(Base, UUIDPKMixin, TimestampMixin):
    """Timeline/activity feed entries visible to the customer."""
    __tablename__ = "project_updates"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=True)
    attachments = Column(JSON, default=list)  # list[str] urls

    project = relationship("Project", back_populates="updates")
    author = relationship("User")


class DocumentCategory(str, enum.Enum):
    FLOOR_PLAN = "FLOOR_PLAN"
    RENDER_3D = "RENDER_3D"
    CONTRACT = "CONTRACT"
    QUOTATION = "QUOTATION"
    MATERIAL_DOC = "MATERIAL_DOC"
    OTHER = "OTHER"


class ProjectDocument(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "project_documents"

    __table_args__ = (Index("ix_documents_project", "project_id", "is_deleted"),)

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    category = Column(Enum(DocumentCategory), nullable=False, default=DocumentCategory.OTHER)
    file_name = Column(String(255), nullable=False)       # original filename (display only)
    storage_key = Column(String(500), nullable=False)     # secure, non-guessable storage path/key
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(120), nullable=False)

    project = relationship("Project", back_populates="documents")
    uploaded_by = relationship("User")


class DesignProposalStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class DesignProposal(Base, UUIDPKMixin, TimestampMixin):
    """Versioned design proposal. Never overwritten — new versions are appended."""
    __tablename__ = "design_proposals"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    version = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    files = Column(JSON, default=list)  # list[str] storage keys/urls
    status = Column(Enum(DesignProposalStatus), default=DesignProposalStatus.PENDING_REVIEW, nullable=False)

    project = relationship("Project", back_populates="design_proposals")
    uploaded_by = relationship("User")
    approvals = relationship("DesignApproval", back_populates="proposal", cascade="all, delete-orphan")


class DesignApproval(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "design_approvals"

    proposal_id = Column(UUID(as_uuid=True), ForeignKey("design_proposals.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    decision = Column(Enum(DesignProposalStatus), nullable=False)
    comment = Column(Text, nullable=True)

    proposal = relationship("DesignProposal", back_populates="approvals")
    customer = relationship("User")
