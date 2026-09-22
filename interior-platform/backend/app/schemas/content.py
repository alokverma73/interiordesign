import uuid
from typing import Any, Optional

from pydantic import BaseModel, EmailStr


class TestimonialCreate(BaseModel):
    client_name: str
    client_location: Optional[str] = None
    client_photo_url: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    rating: int = 5
    content: str


class TestimonialAdminUpdate(BaseModel):
    is_approved: Optional[bool] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None


class TestimonialOut(BaseModel):
    id: uuid.UUID
    client_name: str
    client_location: Optional[str]
    client_photo_url: Optional[str]
    rating: int
    content: str
    is_published: bool
    is_featured: bool

    model_config = {"from_attributes": True}


class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    featured_image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    is_published: bool = False
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class BlogPostOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    excerpt: Optional[str]
    content: str
    featured_image_url: Optional[str]
    is_published: bool

    model_config = {"from_attributes": True}


class FAQCreate(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    display_order: int = 0
    is_published: bool = True


class FAQOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    category: Optional[str]

    model_config = {"from_attributes": True}


class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str


class WebsiteSettingUpdate(BaseModel):
    key: str
    value: Any
    group: Optional[str] = None
