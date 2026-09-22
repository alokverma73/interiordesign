"""
Import every model module here so that Base.metadata is fully populated
(required for Alembic autogenerate and for `Base.metadata.create_all`).
"""
from app.models.user import User, Role, Permission, CustomerProfile, UserType, StaffRole  # noqa
from app.models.project import (  # noqa
    Service, Project, ProjectMember, ProjectMilestone, ProjectUpdate,
    ProjectDocument, DesignProposal, DesignApproval,
    ProjectCategory, ProjectStatus, ProjectMemberRole, DocumentCategory, DesignProposalStatus,
)
from app.models.sales import (  # noqa
    Enquiry, Quote, Appointment, BusinessHours, BlockedDate,
    EnquiryStatus, QuoteStatus, AppointmentStatus, BudgetRange,
)
from app.models.communication import Conversation, Message, Notification, NotificationType  # noqa
from app.models.content import (  # noqa
    Testimonial, GalleryImage, BlogCategory, BlogPost, FAQ, ContactMessage, WebsiteSetting,
)
from app.models.audit import AuditLog  # noqa
