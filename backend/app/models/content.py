from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.config.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class Testimonial(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "testimonials"

    __table_args__ = (Index("ix_testimonials_published", "is_published", "is_featured", "display_order"),)

    client_name = Column(String(150), nullable=False)
    client_location = Column(String(150), nullable=True)
    client_photo_url = Column(String(500), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    rating = Column(Integer, default=5)
    content = Column(Text, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0)

    project = relationship("Project")


class GalleryImage(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "gallery_images"

    image_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)  # Living Room, Kitchen, etc.
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True, nullable=False)

    project = relationship("Project")


class BlogCategory(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "blog_categories"

    name = Column(String(120), nullable=False, unique=True)
    slug = Column(String(140), nullable=False, unique=True, index=True)


class BlogPost(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "blog_posts"

    __table_args__ = (Index("ix_blog_published", "is_published", "created_at"),)

    title = Column(String(220), nullable=False)
    slug = Column(String(240), unique=True, nullable=False, index=True)
    excerpt = Column(String(400), nullable=True)
    content = Column(Text, nullable=False)
    featured_image_url = Column(String(500), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("blog_categories.id"), nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(String(50), nullable=True)

    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(300), nullable=True)

    category = relationship("BlogCategory")
    author = relationship("User")


class FAQ(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "faqs"

    question = Column(String(300), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)  # General, Pricing, Process...
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True, nullable=False)


class ContactMessage(Base, UUIDPKMixin, TimestampMixin):
    """Generic contact-form submissions (separate from the structured Enquiry/quote flow)."""
    __tablename__ = "contact_messages"

    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    subject = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)


class WebsiteSetting(Base, UUIDPKMixin, TimestampMixin):
    """Single-row-per-key settings store, admin-editable. Powers the CMS-controlled content."""
    __tablename__ = "website_settings"

    key = Column(String(150), unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=True)  # flexible: string, number, object, list
    group = Column(String(100), nullable=True)  # "homepage", "company", "seo", etc.
